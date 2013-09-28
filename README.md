Evercookie
==========

Evercookie is a Javascript API that produces extremely persistent cookies in a
browser. Its goal is to identify a client even after they've removed standard
cookies, Flash cookies (Local Shared Objects or LSOs), and others.

This is accomplished by storing the cookie data as many browser storage
mechanisms as possible. If cookie data is removed from any of the storage
mechanisms, evercookie aggressively re-creates it in each mechanism as long as
one is still intact.

If the LSO mechanism is available, Evercookie may even propagate cookies
between different browsers on the same client machine!

Browser Storage Mechanisms
--------------------------

Client browsers must support as many of the following storage mechanisms as
possible in order for Evercookie to be effective.

- Standard [HTTP Cookies](http://en.wikipedia.org/wiki/HTTP_cookie)
- Flash [Local Shared Objects](http://en.wikipedia.org/wiki/Local_Shared_Object)
- Silverlight [Isolated Storage](http://www.silverlight.net/learn/quickstarts/isolatedstorage/)
- CSS [History Knocking](http://samy.pl/csshack/)
- Storing cookies in [HTTP ETags](http://en.wikipedia.org/wiki/HTTP_ETag)
- Storing cookies in [Web cache](http://en.wikipedia.org/wiki/Web_cache)
- [window.name caching](http://en.wikipedia.org/wiki/HTTP_cookie#window.name)
- Internet Explorer [userData storage](http://msdn.microsoft.com/en-us/library/ms531424.aspx)
- HTML5 [Session Storage](http://dev.w3.org/html5/webstorage/#the-sessionstorage-attribute)
- HTML5 [Local Storage](http://dev.w3.org/html5/webstorage/#dom-localstorage)
- HTML5 [Global Storage](https://developer.mozilla.org/en/dom/storage#globalStorage)
- HTML5 [Database Storage via SQLite](http://dev.w3.org/html5/webdatabase/)
- HTML5 Canvas - Cookie values stored in RGB data of auto-generated, force-cached PNG images
- Java [JNLP PersistenceService](http://docs.oracle.com/javase/1.5.0/docs/guide/javaws/jnlp/index.html)
- Java exploit [CVE-2013-0422](https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2013-0422) - Attempts to escape the applet sandbox and write cookie data directly to the user's hard drive.

To be implemented someday (perhaps by you?):

- Caching in [HTTP Authentication](http://en.wikipedia.org/wiki/Basic_access_authentication)
- Using Java to produce a unique key based off of NIC info

The Java persistence mechanisms are developed and maintained by [Gabriel Bauman](http://gabrielbauman.com)
[over here](https://github.com/gabrielbauman/evercookie-applet).

Caveats
-------

Be warned! Evercookie can potentially cause problems for you or your users.

- Some storage mechanisms involve loading Silverlight or Flash in the client
  browser. On some machines this can be a very slow process with lots of disk
  thrashing. On older mobile devices this can render your site unusable.

- CSS History Knocking can cause a large number of HTTP requests when a cookie
  is first being set.

- In some circles, it is considered rude to use Evercookie. Consider your
  reputation and your audience when using Evercookie in production.

- Browser vendors are doing their best to plug many of the holes exploited by
  Evercookie. This is a good thing for the Internet, but it means what works
  today may not work so well tomorrow.

You are responsible for your own decision to use Evercookie. Choose wisely.

Got an idea?
------------

Open a pull request!
