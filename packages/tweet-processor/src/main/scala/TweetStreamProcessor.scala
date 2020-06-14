import org.apache.spark.sql.SparkSession
import org.apache.spark.streaming.dstream.DStream
import org.apache.spark.streaming.StreamingContext._
import org.apache.spark.streaming.{ Seconds, StreamingContext }
import org.apache.kafka.clients.consumer.ConsumerRecord
import org.apache.kafka.common.serialization.StringDeserializer
import org.apache.spark.streaming.kafka010._
import org.apache.spark.streaming.kafka010.LocationStrategies.PreferBrokers
import org.apache.spark.streaming.kafka010.ConsumerStrategies.Subscribe
import org.apache.spark.sql.types.{ StructType, StringType, StructField, DateType }
import org.bson.Document
import com.mongodb.spark._
import com.mongodb.spark.config._
import org.apache.spark.sql.Row
import org.apache.spark.sql.functions._
import org.apache.commons.lang3.StringUtils
import com.vdurmont.emoji.EmojiParser
import org.apache.spark.sql.functions.array
import com.mongodb.spark.sql.fieldTypes


case class SeenWord(_id: fieldTypes.ObjectId, word: String, frequency: Long)

object TweetStreamProcessor {
  def main(args: Array[String]) {
    val kafkaParams = Map[String, Object](
      "bootstrap.servers" -> "localhost:9092",
      "key.deserializer" -> classOf[StringDeserializer],
      "value.deserializer" -> classOf[StringDeserializer],
      "group.id" -> "tweet-stream",
      "auto.offset.reset" -> "latest",
      "enable.auto.commit" -> (false: java.lang.Boolean),
      "fetch.message.max.bytes" -> (2097152: java.lang.Integer)
    )

    val mongodbTweetWriteConfig = WriteConfig(Map(
      "collection" -> "tweets",
      "uri" -> "mongodb://127.0.0.1:27017/twitter-data"
    ))
    
    val topics = Array("tweets")
    val spark = SparkSession
      .builder()
      .master("local[2]")
      .appName("Twitter Stream Processor")
      .getOrCreate()

    spark.sparkContext.setLogLevel("ERROR")

    val ssc = new StreamingContext(spark.sparkContext, Seconds(4))
    val stream = KafkaUtils.createDirectStream[String, String](
      ssc,
      PreferBrokers,
      Subscribe[String, String](topics, kafkaParams)
    )

    val schema = StructType(
      Array(
        StructField("id_str", StringType, false),
        StructField("created_at", StringType, false),
        StructField("text", StringType, false),
        StructField("user", StructType(Array(StructField("location", StringType, true))), false)
      )
    )
    
    import spark.implicits._

    val dictionary = spark.read.text("resources/dictionary.txt")
    dictionary.withColumnRenamed("value", "correction")
    dictionary.createOrReplaceTempView("dictionary")
    val badWordsDictionary = spark.read.text("resources/bad-words.txt")
    badWordsDictionary.createOrReplaceTempView("bad_words_dictionary")

    stream.foreachRDD(rddRaw => {

      val rdd = rddRaw.map(_.value.toString)
      val mongoDocuments = rdd.map(Document.parse)
      mongoDocuments.saveToMongoDB(mongodbTweetWriteConfig)

      val rawTweetDf = spark.read.schema(schema).json(rdd)
      rawTweetDf.createOrReplaceTempView("tweets")

      val tweetText = rawTweetDf.select("text")

      val seenWords = MongoSpark.load[SeenWord](spark, ReadConfig(Map("uri" -> "mongodb://127.0.0.1:27017/twitter-data.seenWords")))
      val tweetWords = tweetText
        .flatMap{ case Row(s: String) => s.toLowerCase.split(" ") }
        .map(x => x.replaceAll("[()`~,|\\.?'\":;/\\*\\-\\+!#$%\\^&_=1234567890]", ""))
        .map(s => s.replaceAll("\\s", ""))
        .filter(s => s != "")
        .map(w => (w, 1)).toDF("word", "frequency")

      tweetWords.show
      val knownWords = tweetWords
        .groupBy("word")
        .count()
        .join(seenWords, tweetWords("word") === seenWords("word"), "left")
        .toDF("word", "f", "_id", "value", "frequency")
        .na.fill(0, Array("frequency"))
        .select($"_id", $"word", ($"f" + $"frequency").as("frequency"))

      knownWords
        .write
        .option("uri", "mongodb://127.0.0.1:27017/twitter-data")
        .option("collection", "seenWords")
        .mode("append")
        .format("mongo")
        .save()

      val cleanedWords = tweetWords.map{ case Row(s: String, f: Integer) => EmojiParser.removeAllEmojis(s)}
        .flatMap(_.split(" "))
        .map(_.trim.toLowerCase)
        .map(StringUtils.stripAccents(_))
        .filter(StringUtils.isAsciiPrintable(_))

      cleanedWords.createOrReplaceTempView("tweet_words")
      
      val misspelledWords = spark.sql("SELECT * from tweet_words where `value` NOT IN (select `value` from dictionary)")
      misspelledWords.show

      val spellingCorrections = misspelledWords.crossJoin(dictionary)
        .withColumn("LD", levenshtein(misspelledWords.col("value"), dictionary.col("value")))
        .filter($"LD" < 2)
        .sort(asc("LD"))
        .toDF("original", "correction", "LD")

      spellingCorrections.show

      spellingCorrections
        .write
        .option("uri", "mongodb://127.0.0.1:27017/twitter-data")
        .option("collection", "spellingCorrections")
        .mode("append")
        .format("mongo")
        .save()

      val offensiveWords = cleanedWords.crossJoin(badWordsDictionary)
        .withColumn("LD", levenshtein(cleanedWords.col("value"), badWordsDictionary.col("value")))
        .filter($"LD" < 2)
        .sort(asc("LD"))
      
      offensiveWords
        .write
        .option("uri", "mongodb://127.0.0.1:27017/twitter-data")
        .option("collection", "offensiveWords")
        .mode("append")
        .format("mongo")
        .save()
    })

    ssc.start()
    ssc.awaitTermination()
  }
}