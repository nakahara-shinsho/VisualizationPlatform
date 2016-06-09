steps:

1.@install 
+ install nodejs v0.10.(26 or 30).x
+ install python 2.7.x
+ install Visual Studio Express 2012
+ install Window SDK
+ install OpenSSL
+ npm install node-gyp -g
+ npm install node-inspector -g
+ npm install grunt-node-inspector -g

+ npm install -g grunt-cli
+ npm install --msvs_version=2012 bcrypt
+ npm install --msvs_version=2012 sqlite3

Open CMD at source code folder:
> npm install 

2.set RabbitMQ server address in config/default.json

+ install erlang http://vc1.tsdv.com.vn/2015A/polyspector/trunk/other/fromTSDV/otp_win32_17.5.exe
+ install RabbitMQ https://www.rabbitmq.com/releases/rabbitmq-server/v3.5.2/rabbitmq-server-3.5.2.exe

4. start system
> startup-windows-release.bat

5. open chrome access 'localhost:8003' (default)

or change port in:
¦server configration file : config/default.json

*******
6. For behavior test (using webdriverjs with jasmine):
change path of behavior test from "client/test/behavior" to "client-release/test/behavior" in "gruntfile.js" file
> startup-windows-release.bat
> grunt test

7. For unit test (using grunt with jasmine):
modify gruntfile.js (add jasmine task), add UT test spec ("ut" folder) at "client-release/test"
> grunt utTest