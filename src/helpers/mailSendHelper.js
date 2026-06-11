const transporter = require("../configs/mailConfig");
module.exports = {
  async mailSend(email, fromName, subject, mailBody) {
    // Send mail with defined transport object
    try {
      await transporter.sendMail({
        from: `${fromName} <${process.env.MAIL_FROM}>`,
        to: email,
        subject: subject,
        html: mailBody,
      });
      return "yes";
    } catch (error) {
      console.error(error);
      console.log("Error occurred while sending email");
      return "no";
    }
  },

  async mailSendWithAttachment(email, fromName, subject, mailBody, filename, path) {
    const attachment = {
      filename: filename,
      path: path, // URL of the file
    };
    let mailOptions = {
      from: `${fromName} <${process.env.MAIL_FROM}>`,
      to: email,
      subject: subject,
      html: mailBody,
      attachments: [attachment],
    };

    // Send mail with defined transport object
    try {
      let info = await transporter.sendMail(mailOptions);
      console.log("Message sent: %s", info.messageId);
      return "yes";
    } catch (error) {
      console.error(error);
      console.log("Error occurred while sending email");
      return "no";
    }
  },

  async bulkMailSend(fromName, mailData) {
    const results = [];
    await Promise.all(
      mailData.map(async (emailDetails) => {
        const mailBody = emailDetails.mailBody;
        const subject = emailDetails.subject;
        const email = emailDetails.email;
        try {
          await transporter.sendMail({
            from: `${fromName} <${process.env.MAIL_FROM}>`,
            to: email,
            subject: subject,
            html: mailBody,
          });
          results.push({ email, status: "success" });
        } catch (error) {
          console.error("Mail failed:", email, error);
          results.push({ email, status: "failed" });
        }
      })
    );
    // Delay between batches to avoid throttling
    await new Promise((res) => setTimeout(res, 2000));
    return results;
  },

  // Forgot password mail body
  async mailBodyData(postData) {
    const date = new Date().getFullYear();
    let body = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
            <title>Welcome to ${postData.appName}</title>
        </head>
        <body style="margin: 0; padding: 0; font-size: 13px; color: #444; font-family: Inter, Helvetica, sans-serif; padding-top: 70px; padding-bottom: 70px;">
            <table cellspacing="0" cellpadding="0" align="center" width="768" class="outer-tbl" style="margin: 0 auto;">
                <tr>
                    <td class="pad-l-r-b" style="background-color: ${postData.borderBackground}; padding: 0 70px 40px;">
                        <table cellpadding="0" cellspacing="0" class="full-wid"></table>
                        <table cellpadding="0" cellspacing="0" style="width: 100%; background-color: #FFFFFF; border-radius: 4px; box-shadow: 0 0 20px #ccc; margin-top: 40px;">
                            <tr>
                                <td>
                                    <table border="0" style="margin: 0; width: 100%;" cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td class="logo" style="padding: 40px 0 30px 0; background-color: #FFFFFF; text-align: center; border-bottom: 1px solid #E1E1E1;">
                                                <img src="${postData.appLogo}" alt="" width="50%" height="30%" style="background-color: white; padding: 5px;">
                                                <div style="max-width: 600px; margin: 0 auto; font-family: Poppins, sans-serif; color: #333;"><h2 style="text-align: center; color: #333; margin-bottom: 10px;">${postData.mailHeading}</h2></div>
                                            </td>
                                        </tr>
                                        <tr><td></td></tr>
                                        <tr>
                                            <td class="content" style="padding: 40px 40px;">
                                                <p style="font-family: Inter, Helvetica, sans-serif; font-size: 15px; color: #333333; margin-top: 0;">
                                                    ${postData.headerGreeting} ${postData.name},</p>
                                                <p style="font-family: Inter, Helvetica, sans-serif; font-size: 15px; color: #333333; margin-top: 0;">
                                                    ${postData.mailContent}</p>
                                                <p style="font-family: Inter, Helvetica, sans-serif; font-size: 15px; color: #333333; margin-top: 0;">
                                                 ${postData.footerGreeting},                  	
                                                </p>
                                                <p style="font-family: Inter, Helvetica, sans-serif; font-size: 15px; color: #333333; margin-top: 0;">
                                                    ${postData.appName}            	
                                                </p>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td  style="background: ${postData.footerBackground}; padding-bottom: 60px;">
                                                <table style="width: 100%;" border="0" cellspacing="0" cellpadding="0" class="full-wid" align="center">
                                                    <tr>
                                                        <td>
                                                            <div style="margin: 0 auto; text-align: center; padding: 0 100px;" class="foot-items">
                                                                <p style="font-family: Inter, Helvetica, sans-serif; font-size: 14px; color: #fbfbfb; margin-top: 40px; line-height: 20px;">
                                                                    &#169; ${date} ${postData.appName}.  ${postData.footerDescription}
                                                                </p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
    `;
    return body;
  },

  //   verify user send otp

  async generateOtpMailBody({ name, otp, appName, appLogo, footerBackground }) {
    let body = `
     <!DOCTYPE html>
      <html>
         <head>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
            <title>Welcome to ${appName}</title>
        </head>
        <body style="margin: 0; padding: 0; font-size: 13px; color: #444; font-family: Inter, Helvetica, sans-serif; padding-top: 70px; padding-bottom: 70px;">
        <div style="font-family: Inter, sans-serif; background-color: #f0f4ff; padding: 30px">
        <div style="max-width: 500px; margin: auto; background: #ffffff; border-radius: 10px; padding: 40px">
          <div style="text-align: center; margin-bottom: 30px">
            <img src="${appLogo}" height="40" alt="${appName} logo" />
            <h2 style="margin: 0; color: #000">Confirm Verification Code</h2>
          </div>
          <p>Hi ${name},</p>
          <p>Here is your One Time Password (OTP).</p>
          <div style="display: flex; justify-content: center; font-size: 32px; font-weight: bold; letter-spacing: 16px; margin: 20px 0;">
            ${otp.split("").join(" ")}
          </div>
          <p>This code will be valid for 5 minutes. If it does not work, you can try requesting a new one.</p>
          <p>Thanks,<br/>${appName} Team</p>
        </div>
        <p style="text-align: center; font-size: 12px; color: #555; margin-top: 40px">
          &copy; 2025 ${appName} • All rights reserved
        </p>
      </div>
         </body>
       </html>
      
    `;
    return body;
  },
};
