# Информационная система для управления объектами
### Вариант 4089

проброс портов:
ssh -p 2222 sxxxxxxx@se.ifmo.ru -L yyyyy:helios.cs.ifmo.ru:yyyyy

запуск сервера wildfly: 
bash wildfly/wildfly-21.0.0.Final/bin/standalone.sh

подключение к postgresql и выполнение скрипта
psql -U sXXXXXX -d studs -f ./src/resources/db/init.sql