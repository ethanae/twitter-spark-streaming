FROM openjdk:8-jdk-alpine

WORKDIR /app

ENV SCALA_VERSION=2.11.8
ENV SCALA_HOME=/usr/share/scala
ENV SBT_VERSION=1.3.12
ENV SBT_HOME=/usr/local/sbt
ENV PATH=${PATH}:${SBT_HOME}/bin

RUN apk add --no-cache --virtual=.build-dependencies wget ca-certificates && \
    apk add --no-cache bash curl jq && \
    cd "/tmp" && \
    wget --no-verbose "https://downloads.typesafe.com/scala/${SCALA_VERSION}/scala-${SCALA_VERSION}.tgz" && \
    tar xzf "scala-${SCALA_VERSION}.tgz" && \
    mkdir "${SCALA_HOME}" && \
    rm "/tmp/scala-${SCALA_VERSION}/bin/"*.bat && \
    mv "/tmp/scala-${SCALA_VERSION}/bin" "/tmp/scala-${SCALA_VERSION}/lib" "${SCALA_HOME}" && \
    ln -s "${SCALA_HOME}/bin/"* "/usr/bin/" && \
    apk del .build-dependencies && \
    rm -rf "/tmp/"*

RUN apk --no-cache --update add bash wget && mkdir -p "$SBT_HOME" && \
    wget --no-check-certificate "https://github.com/sbt/sbt/releases/download/v$SBT_VERSION/sbt-$SBT_VERSION.tgz" && \
    tar xzf "sbt-$SBT_VERSION.tgz" -C $SBT_HOME --strip-components=1

CMD ["sbt", "run"]