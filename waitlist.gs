// Run setupWaitlist once from the Apps Script editor opened from the Google Form.
function setupWaitlist() {
  const form = FormApp.getActiveForm();
  if (!form) throw new Error('Open Apps Script from the Google Form editor.');

  const emailItems = form.getItems(FormApp.ItemType.TEXT)
    .filter(item => item.getTitle().trim().toLowerCase() === 'email address');
  if (emailItems.length !== 1 || !emailItems[0].asTextItem().isRequired()) {
    throw new Error('Add one required short-answer question named Email address.');
  }

  PropertiesService.getScriptProperties().setProperties({
    WAITLIST_FORM_ID: form.getId(),
    WAITLIST_EMAIL_ITEM_ID: String(emailItems[0].getId())
  });
}

function doGet() {
  return HtmlService.createHtmlOutput(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>SOKUL waitlist</title>
        <style>
          * { box-sizing: border-box; }
          body { margin: 0; padding: .25rem; font: 1rem system-ui, sans-serif; color: #183322; background: #faf7ef; }
          label { display: block; margin-bottom: .4rem; font-weight: 650; }
          input, button { font: inherit; border-radius: .35rem; }
          input { display: block; width: 100%; padding: .75rem; border: 1px solid #7b8576; background: #fffdf8; }
          button { margin-top: .75rem; padding: .75rem 1.15rem; border: 0; background: #20452e; color: #fffaf0; font-weight: 750; cursor: pointer; }
          button:disabled { opacity: .65; cursor: wait; }
          :focus-visible { outline: 2px solid #245a3b; outline-offset: 2px; }
          #status { margin: .6rem 0 0; }
        </style>
      </head>
      <body>
        <form id="waitlist">
          <label for="email">Email address</label>
          <input id="email" type="email" autocomplete="email" maxlength="254" required>
          <button type="submit" disabled>Notify me</button>
        </form>
        <p id="status" role="status" tabindex="-1"></p>
        <script>
          const form = document.querySelector('#waitlist');
          const button = form.querySelector('button');
          const status = document.querySelector('#status');

          form.addEventListener('submit', event => {
            event.preventDefault();
            button.disabled = true;
            status.textContent = 'Submitting…';
            google.script.run
              .withSuccessHandler(() => {
                form.reset();
                form.hidden = true;
                status.textContent = 'You’re on the list. We’ll email you when the Family Trail Pack is available.';
                status.focus();
              })
              .withFailureHandler(() => {
                status.textContent = 'We couldn’t save your email. Please try again.';
                button.disabled = false;
              })
              .submitWaitlist(document.querySelector('#email').value);
          });

          button.disabled = false;
        </script>
      </body>
    </html>
  `).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function submitWaitlist(value) {
  const email = typeof value === 'string' ? value.trim() : '';
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Enter a valid email address.');
  }

  const properties = PropertiesService.getScriptProperties();
  const form = FormApp.openById(properties.getProperty('WAITLIST_FORM_ID'));
  const emailItem = form.getItemById(Number(properties.getProperty('WAITLIST_EMAIL_ITEM_ID'))).asTextItem();
  form.createResponse().withItemResponse(emailItem.createResponse(email)).submit();
  return true;
}
