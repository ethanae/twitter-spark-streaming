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
    val mongodbWriteConfig = WriteConfig(Map(
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

    val ssc = new StreamingContext(spark.sparkContext, Seconds(6))
    val stream = KafkaUtils.createDirectStream[String, String](
      ssc,
      PreferBrokers,
      Subscribe[String, String](topics, kafkaParams)
    )

    val schema = StructType(
      Array(
        StructField("created_at", StringType, false),
        StructField("text", StringType, false),
        StructField("user", StructType(Array(StructField("location", StringType, true))), false)
      )
    )
    
    import spark.implicits._

    val dictionary = spark.read.text("resources/dictionary.txt")
    dictionary.createOrReplaceTempView("dictionary")
    val badWordsDictionary = spark.read.text("resources/bad-words.txt")
    badWordsDictionary.createOrReplaceTempView("bad_words_dictionary")

    stream.foreachRDD(rddRaw => {
      val rdd = rddRaw.map(_.value.toString)
      val mongoDocuments = rdd.map(Document.parse)
      mongoDocuments.saveToMongoDB(mongodbWriteConfig)

      val df = spark.read.schema(schema).json(rdd)
      df.createOrReplaceTempView("tweets")

      val tweetWords = df.select("text")
        .map{ case Row(s: String) => EmojiParser.removeAllEmojis(s) }
        .flatMap( _.split(" ") )
        .map(_.trim)
        .map(StringUtils.stripAccents(_))
      
      tweetWords.createOrReplaceTempView("tweet_words")

      val misspelledWords = spark.sql("SELECT * from tweet_words where `value` NOT IN (select `value` from dictionary)")
      misspelledWords.show

      val probableCorrectSpellings = misspelledWords.crossJoin(dictionary)
        .withColumn("LD", levenshtein(misspelledWords.col("value"), dictionary.col("value")))
        .filter($"LD" < 2)
        .sort(asc("LD"))
        .show

      val offensiveWords = tweetWords.crossJoin(badWordsDictionary)
        .withColumn("LD", levenshtein(tweetWords.col("value"), badWordsDictionary.col("value")))
        .filter($"LD" < 2)
        .sort(asc("LD"))
        .show
      
      
    })

    ssc.start()
    ssc.awaitTermination()
  }
}