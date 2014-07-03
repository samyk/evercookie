package evercookie;

import java.awt.Color;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.OutputStream;

import javax.imageio.ImageIO;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * This is a Java Servlet port of evercookie_png.php, the server-side component
 * of Evercookie that stores values in force-cached PNG image data.
 * 
 * Install this servlet at /evercookie_png.php in your web.xml (or add a @WebServlet
 * annotation) and you won't even need to modify evercookie.js! This assumes
 * that Evercookie's assets are in your web root.
 * 
 * Of course, if you have set $_ec_baseurl to something, you should install this
 * at [$_ec_baseurl]evercookie_png.php. Remember, $ec_baseurl needs a trailing
 * slash in the evercookie.js.
 * 
 * @author Gabriel Bauman <gabe@codehaus.org>
 * 
 */
public class EvercookiePngServlet extends HttpServlet {

	private static final long serialVersionUID = 1L;

	public EvercookiePngServlet() {
		super();
	}

	@Override
	protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {

		boolean cookieExists = false;
		String cookieValue = null;
		Cookie[] cookies = req.getCookies();

		if (null != cookies) {
			// Iterate over cookies until we find one named evercookie_png
			for (Cookie cookie : cookies)
			{
				if (cookie.getName().equals("evercookie_png")) {
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

		// Generate a PNG image from the cookie value.
		BufferedImage image = new BufferedImage(200, 1, BufferedImage.TYPE_INT_ARGB);
		image.createGraphics().setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_OFF);
		int x = 0;

		for (int i = 0; i < cookieValue.length(); i += 3) {
			// Treat every 3 chars of the cookie value as an {R,G,B} triplet.
			Color c = new Color(cookieValue.charAt(i), cookieValue.charAt(i + 1), cookieValue.charAt(i + 2));
			image.setRGB(x++, 0, c.getRGB());
		}

		// The cookie was present; set up the response headers.
		resp.setContentType("image/png");
		resp.addHeader("Last-Modified", "Wed, 30 Jun 2010 21:36:48 GMT");
		resp.addHeader("Expires", "Tue, 31 Dec 2033 23:30:45 GMT");
		resp.addHeader("Cache-Control", "private, max-age=630720000");

		// Send the generate image data as the response body.
		OutputStream body = resp.getOutputStream();

		try {
			ImageIO.write(image, "png", body);
		} finally {
			body.close();
		}

		// And we're done.
		resp.setStatus(200);
		resp.flushBuffer();
	}
}
