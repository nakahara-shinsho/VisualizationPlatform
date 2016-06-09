
// Require
var webdriver = require('selenium-webdriver');
var test      = require('selenium-webdriver/testing');
var os        = require('os');
var ifaces    = os.networkInterfaces();


var ipAddress;
var timeout = 2000000;

var browser = new webdriver.Builder()
      .withCapabilities(webdriver.Capabilities.chrome())
      .build();

jasmine.DEFAULT_TIMEOUT_INTERVAL = 9999999;

describe("Line Chart Test", function(){

  // BEFORE ACTION
  // 1.get ip address
  // 2.connect page
  // 3.login
  beforeAll(function(done){
    // ACCESS BROWSER
    this.timeout = timeout;
    Object.keys(ifaces).forEach(function (ifname) {
      ifaces[ifname].forEach(function (iface) {
        if ('IPv4' !== iface.family || iface.internal !== false) {
          // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
          return;
        }
        ipAddress = iface.address;
      });
    });
    browser.get("http://"+ ipAddress +":8003");
    browser.wait(function () {
      browser.isElementPresent(webdriver.By.name('username'))
        .then(function (flag) {
        if(flag){
          // Login
          browser.findElement(webdriver.By.name('username')).sendKeys('admin');
          browser.findElement(webdriver.By.name('user_password')).sendKeys('admin');
          browser.findElement(webdriver.By.id('login-btn')).click();
          // WAIT TO  GENERATE SVG TAG
          browser.wait(function(){
            browser.isElementPresent(webdriver.By.tagName('svg'))
              .then(function (flag) {
                if(flag){
                  done();
                }
              });
          }, timeout);
        }
      });
    }, timeout);
  });

  // AFTER ACTION
  // 1.logout
  afterAll(function(done){
    // Logout
    browser.findElement(webdriver.By.className('fa-user')).click();
    // WAIT TO  GENERATE SVG TAG
    browser.wait(function (){
      browser.isElementPresent(webdriver.By.name('username'))
      .then(function(flag){
        if(flag){
          browser.quit();
          done();
        }
      });
    },timeout);
  });

  /**
   * Test
   **/
  describe("Initial View Test", function(){
    it("The Number Of Paths", function(){
      browser.findElements(webdriver.By.tagName("path"))
        .then(function(elems){
          // Axis : 2, SelectableAxis : 1,  Line : 3
          expect(elems.length).toEqual(3+3);
        });
    });
    it("The Number Of Legends", function(){
      browser.findElements(webdriver.By.className("legend"))
        .then(function(elems){
          expect(elems.length).toEqual(3);
        });
    });
    xit("The Labels Of Legends", function(){
    });
    xit("The Value Of X Axis'ticks", function(){
    });
    xit("The Value Of Y Axis'ticks", function(){
    });
    xit("The Label Of X Axis", function(){
    });
    xit("The Label Of Y Axis", function(){
    });
  });
});
