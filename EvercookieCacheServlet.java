package evercookie;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.ServletOutputStream;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * This is a Java Servlet port of evercookie_cache.php, the server-side
 * component of Evercookie's cacheData mechanism.
 * 
 * Install this servlet at /evercookie_cache.php in your web.xml (or add a @WebServlet
 * annotation) and you won't even need to modify evercookie.js! This assumes
 * that Evercookie's assets are in your web root.
 * 
 * Of course, if you have set $_ec_baseurl to something, you should install this
 * at [$_ec_baseurl]evercookie_cache.php. Remember, $ec_baseurl needs a trailing
 * slash in the evercookie.js.
 * 
 * @author Gabriel Bauman <gabe@codehaus.org>
 * 
 */
public class EvercookieCacheServlet extends HttpServlet {

	private static final long serialVersionUID = 1L;

	public EvercookieCacheServlet() {
		super();
	}

	@Override
	protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {

		boolean cookieExists = false;
		String cookieValue = null;
		Cookie[] cookies = req.getCookies();

		if (null != cookies) {
			// Iterate over cookies until we find one named evercookie_cache
			for (Cookie cookie : cookies)
			{
				if (cookie.getName().equals("evercookie_cache")) {
					cookieExists = true;
					cookieValue = cookie.getValue();
					break;
				}
			}
		}

		// If the cookie doesn't exist, send 304 Not Modified and exit.
		if (!cookieExists) {
			resp.setStatus(304);
			return;
		}

		// The cookie was present; set up the response headers.
		resp.setContentType("text/html");
		resp.addHeader("Last-Modified", "Wed, 30 Jun 2010 21:36:48 GMT");
		resp.addHeader("Expires", "Tue, 31 Dec 2030 23:30:45 GMT");
		resp.addHeader("Cache-Control", "private, max-age=630720000");

		// Print the contents of the cookie as the response body.
		ServletOutputStream body = resp.getOutputStream();

		try {
			body.print(cookieValue);
		} finally {
			body.close();
		}

		// And we're done.
		resp.setStatus(200);
		resp.flushBuffer();
	}
}
