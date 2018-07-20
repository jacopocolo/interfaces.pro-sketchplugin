//Let's import the library that allows us to talk with the UI
@import "MochaJSDelegate.js";

// let's get a hold on the Sketch API
const sketch = require('sketch')
//let's expose these globally
var context;
var document;
var page;
var focus = true;
var firstTime = true;
var windowX;
var windowY;

//the main function we run when we execute the plugin. It creates the webview and hooks
function onRun(context) {
  context = context;
  document = sketch.fromNative(context.document)
  page = document.selectedPage;
  string = "hello";

  var userDefaults = NSUserDefaults.standardUserDefaults();

	// Create a window
  var title = "Interfaces Pro";
  var identifier = "pro.interfaces";
  var threadDictionary = NSThread.mainThread().threadDictionary();

  if (threadDictionary[identifier]) {
        return;
  }

  var viewportWidth = context.document.contentDrawView().frame().size.width;
  var viewportHeight = context.document.contentDrawView().frame().size.height;

  var windowWidth = viewportWidth-100,
      windowHeight = viewportHeight-100;

    var webViewWindow = NSPanel.alloc().init();
    webViewWindow.setFrame_display(NSMakeRect(0, 0, windowWidth, windowHeight), true);

    webViewWindow.setStyleMask(NSTexturedBackgroundWindowMask | NSTitledWindowMask | NSClosableWindowMask | NSResizableWindowMask);

    //Uncomment the following line to define the app bar color with an NSColor
    webViewWindow.setBackgroundColor(NSColor.whiteColor());
    webViewWindow.standardWindowButton(NSWindowMiniaturizeButton).setHidden(true);
    webViewWindow.standardWindowButton(NSWindowZoomButton).setHidden(true);
    webViewWindow.setTitle(title);
    webViewWindow.setTitlebarAppearsTransparent(true);
    webViewWindow.becomeKeyWindow();
    webViewWindow.setLevel(NSFloatingWindowLevel);
    threadDictionary[identifier] = webViewWindow;
    COScript.currentCOScript().setShouldKeepAround_(true);

    //Add Web View to window
      var webView = WebView.alloc().initWithFrame(NSMakeRect(0, 0, windowWidth, windowHeight - 24));
      webView.setAutoresizingMask(NSViewWidthSizable|NSViewHeightSizable);
      var windowObject = webView.windowScriptObject();
      var delegate = new MochaJSDelegate({

          "webView:didFinishLoadForFrame:" : (function(webView, webFrame) {
              //We call this function when we know that the webview has finished loading
              //It's a function in the UI and we run it with a return coming from the artboardCount
              windowObject.evaluateWebScript("updateInput("+artboardsCount()+")");
          }),

          //To get commands from the webView we observe the location hash: if it changes, we do something
          "webView:didChangeLocationWithinPageForFrame:" : (function(webView, webFrame) {
              var locationHash = windowObject.evaluateWebScript("window.location.hash");
              //The hash object exposes commands and parameters
              //In example, if you send updateHash('add','artboardName','Mark')
              //You’ll be able to use hash.artboardName to return 'Mark'
              var hash = parseHash(locationHash);

              windowX = webViewWindow.frame().origin.x;
              windowY = webViewWindow.frame().origin.y;
              //We parse the location hash and check for the command we are sending from the UI
              //If the command exist we run the following code
              if (hash.hasOwnProperty('blur')) {
                //if we are resizing, we store the width and height for restoring later
                windowWidth = webViewWindow.frame().size.width;
                windowHeight = webViewWindow.frame().size.height;

                //we minimize when the window is out of focus with special handling for first launch
                webViewWindow.setFrame_display(NSMakeRect(windowX, windowY+windowHeight-20, 250, 20), true);
              } else if (hash.hasOwnProperty('focus')) {
                //we expand when the window is in focus
                webViewWindow.setFrame_display(NSMakeRect(windowX, windowY-windowHeight+20, windowWidth, windowHeight), true);
              };
          })
      });

      webView.setFrameLoadDelegate_(delegate.getClassInstance());
      webView.setMainFrameURL_(context.plugin.urlForResourceNamed("ui.html").path());
      webViewWindow.contentView().addSubview(webView);
      //Center the window and set windowX and windowY;
      webViewWindow.center();
      windowX = webViewWindow.frame().origin.x;
      windowY = webViewWindow.frame().origin.y;

      webViewWindow.makeKeyAndOrderFront(nil);
      // Define the close window behaviour on the standard red traffic light button
      var closeButton = webViewWindow.standardWindowButton(NSWindowCloseButton);
      closeButton.setCOSJSTargetFunction(function(sender) {
          COScript.currentCOScript().setShouldKeepAround(false);
          threadDictionary.removeObjectForKey(identifier);
          webViewWindow.close();
      });
      closeButton.setAction("callAction:");
  };

  //A couple of functions used in the plugin:
  //A function to count the number of artboards in the page
  function artboardsCount() {
    var artboardCount = 0;
      for (x=0;x<page.layers.length;x++) {
        if (page.layers[x].type == 'Artboard') {
          artboardCount = artboardCount+1;
        }
      }
      return artboardCount;
  }

  //A function to parse the hash we get back from the webview
  function parseHash(aURL) {
  	aURL = aURL;
  	var vars = {};
  	var hashes = aURL.slice(aURL.indexOf('#') + 1).split('&');

      for(var i = 0; i < hashes.length; i++) {
         var hash = hashes[i].split('=');

         if(hash.length > 1) {
      	   vars[hash[0].toString()] = hash[1];
         } else {
       	  vars[hash[0].toString()] = null;
         }
      }

      return vars;
  }

//The whole function above is run here
onRun(context);
