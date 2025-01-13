export default class Messages {
  constructor(customCss = "") {
    this.header = `<!DOCTYPE html>
			<html lang="en">
			<head>
  				<meta charset="utf-8">
  				<meta name="viewport" content="width=device-width, initial-scale=1">
  				<title>Message</title>
				<style>${customCss}</style>
			</head>
		<body><main>`;

    this.footer = `</main></body></html>`;
  }

  welcomeEmail(token) {
    return "";
  }

  resetEmail(token) {
    return "";
  }

  getHeader() {
    return this.header;
  }

  getFooter() {
    return this.footer;
  }

  getFullMessageHtml(bodyPart) {
    return this.header + bodyPart + this.footer;
  }
}
