plugins {
    java
    war
}

group = "itmo.is"
version = "1.0-SNAPSHOT"

repositories {
    mavenCentral()
}

dependencies {

    providedCompile("javax:javaee-api:8.0.1")
    providedCompile("org.hibernate:hibernate-core:5.3.20.Final")
}

tasks.withType<JavaCompile> {
    options.encoding = "UTF-8"
    options.release.set(11)
}

tasks.war {
    archiveFileName.set("lab1.war")
}