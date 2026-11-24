@echo off
call gradlew.bat war || exit /b 1
scp -P 2222 build\libs\lab1.war s465635@se.ifmo.ru:~/lab1.war.tmp || exit /b 1
ssh -p 2222 s465635@se.ifmo.ru "mv ~/lab1.war.tmp ~/wildfly/wildfly-21.0.0.Final/standalone/deployments/lab1.war"
echo Deploy finished!