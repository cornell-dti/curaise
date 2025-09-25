import { prisma } from "../../utils/prisma";
const cheerio = require("cheerio");
const qp = require("quoted-printable");

export const parseUnverifiedVenmoEmail = (raw: string) => {
  // decode quoted-printable if present
  const htmlString = /=\r?\n|=3D|=20|=[A-F0-9]{2}/i.test(raw)
    ? qp.decode(raw)
    : raw;

  const $ = cheerio.load(htmlString);
  const amount = $('span[style="color:#148572;float:right;"]').text().trim();
  const parsedAmount = parseFloat(amount.replace("$", "").replace("+", ""));

  const orderId = $('table[role="presentation"] tbody tr div p').text().trim();

  return { parsedAmount: parsedAmount, orderId: orderId };
};

if (require.main === module) {
  const result = parseUnverifiedVenmoEmail(`
    <html class=3D""  id=3D"html_container" xmlns=3D"http://www.w3.org/1999/xht=
ml" dir=3D"ltr" lang=3D"en-US" xmlns:fb=3D"http://www.facebook.com/2008/fbm=
l">
    <head>
        <meta http-equiv=3D"Content-Type" content=3D"text/html; charset=3Du=
tf-8">
        <title> - Venmo</title>
    </head>

    <body style=3D"margin:0;color: #2F3033">
       =20
        <div style=3D"font-family:'helvetica neue';">
            <div style=3D"margin: 0 auto; max-width: 320px;">
                <div style=3D"font-size:14px;border: 2px solid #e8ebea;">
                    <div style=3D"padding: 10px 0; text-align: center; back=
ground-color: #0074DE;">
                        <img src=3D"https://s3.amazonaws.com/venmo/venmo-lo=
go-white.png" alt=3D"venmo" title=3D"venmo" style=3D"color: #fff;width:125p=
x;height:24px;" />
                    </div>
                   =20
                    <div style=3D"padding:20px;background-color:#fff;">
                       =20
<div width=3D"100%" >
   =20



   =20


<table role=3D"presentation" width=3D"100%"> <tbody>
    <tr>
        <!-- img of actor -->
        <td valign=3D"top" width=3D"48px" style=3D"padding-right:10px;">
            <a href=3D"https://venmo.com/code?user_id=3D4137051247084955377=
&actor_id=3D4157710534706499920" aria-label=3D"">
                <img src=3D"https://s3.amazonaws.com/venmo/no-image.gif" st=
yle=3D"border-radius:3px;width:48px;height:48px;" alt=3D""/>
            </a>=20
        </td>
        <td style=3D"font-size:14px;color:#2F3033;vertical-align:top;paddin=
g-left:2px;">
            <div style=3D"padding-bottom:5px;">
                <!-- actor name -->
                <a style=3D"color:#0074DE; text-decoration:none" href=3D"ht=
tps://venmo.com/code?user_id=3D4137051247084955377&actor_id=3D4157710534706=
499920">
                    Arsh Singh
                </a>=20
                <!-- action -->
                <span>
                    paid
                </span>
                <!-- recipient name -->
                <a style=3D"color:#0074DE; text-decoration:none"
                   =20
                    href=3D"https://venmo.com/code?user_id=3D41577105347064=
99920&actor_id=3D4157710534706499920">
                   =20
                    you
                </a>=20
            </div>
            <!-- note -->
            <div>
                <p>as4274</p>
            </div>
        </td>
    </tr>
    <tr>
        <td></td>
        <td style=3D"font-size:14px;padding-left:2px;color:#6B6E76;">
        <!-- date, audience, and amount -->
            <span>Sep 16, 2025 PDT</span>
            <span> =C2=B7 </span>
            <img style=3D"vertical-align: -1px;" src=3Dhttps://s3.amazonaws=
.com/venmo/audience/private_v2.png alt=3D"private"/>

            <!-- amount -->
           =20
               =20
                <span style=3D"color:#148572;float:right;">+ $1.00</span>
               =20
           =20
        </td>
    </tr>
   =20
   =20
   =20
    <tr>
        <td></td>
        <td style=3D"font-size:14px;padding-left:2px;font-weight:bold;">
           =20
            <span>
                <a href=3D"https://venmo.com/story/4423269161213529619?k=3D=
1d57b401-b588-45b0-b97e-f235cfca507a" style=3D"text-decoration:none;color:#=
0074DE;">
                    Like
                </a>
            </span>
           =20
               =20
            <span> =C2=B7 </span>
           =20
           =20
            <span>
                <a href=3D"https://venmo.com/story/4423269161213529619?logi=
n=3D1" style=3D"text-decoration:none;color:#0074DE;">
                    Comment
                </a>
            </span>
           =20
        </td>
    </tr>
   =20

</tbody> </table>






    <div style=3D"color:#6B6E76;font-size:12px;margin-top:10px;padding-top:=
10px; border-top: 1px dotted #ccc">
   =20
    <div style=3D"width:100%; padding:10px 0px 10px 0px; text-align:center;=
border-radius:32px; background-color:#0074DE; margin-bottom:5px;">
        <a href=3D"https://venmo.com/cash_out" style=3D"text-decoration:non=
e;  display:block; width:100%; font-size:14px;">
            <div style=3D"font-size:14px; border-radius:32px; background-co=
lor:#0074DE;color:#FFFFFF; font-weight:bold;">
            =09Transfer to your Bank Account
            </div>=20
        </a>
    </div>

    Or save your balance for future payments with friends through Venmo!
</div>

   =20
<div style=3D"color:#6B6E76;font-size:12px;margin-top:10px;padding-top:10px=
; border-top: 1px dotted #ccc">
    <div style=3D"width:50%; padding:5px; text-align:center; border-radius:=
50px; background-color:#0074DE;">
        <a href=3D"https://venmo.com/referral/invite?campaign_service=3Dema=
il&campaign_template=3Dpayment.received" style=3D"text-decoration:none; col=
or: #000; display:block; width:100%; font-size:12px;">
            <div style=3D"font-size:14px; color:#fff;">Invite Friends!</div=
>
        </a>
    </div>


</div>

    <div id=3D"_receipt_disclosures" style=3D"font-size:11px;margin-top:10p=
x;padding-top:10px; border-top: 1px dotted #ccc">

    <div>
        For any issues, including the recipient not receiving funds, contac=
t us at our Help Center at <a style=3D"text-decoration:none;color:#0074DE" =
href=3D"https://help.venmo.com">help.venmo.com</a> or call 1-855-812-4430.
    </div>


    <div style=3D"margin-top:10px;">
        See our <a style=3D"text-decoration:none;color:#0074DE" href=3D"htt=
ps://venmo.com/legal/regulatory-agency-illinois">disclosures</a> for more i=
nformation.<div style=3D"margin-top:10px;">This payment will be reviewed fo=
r compliance with our User Agreement and if we determine that there is a vi=
olation by either party, it may be reversed or your ability to transfer to =
your bank account may be restricted.</div>
    </div>

</div>

</div>

                       =20
                    </div>
                    <div style=3D"padding:10px 15px; color: #6B6E76; text-a=
lign: center;">
                       =20
                       =20
                        <div style=3D"color: #6B6E76; margin-top: 5px;">
                           =20
                                Venmo is a service of PayPal, Inc., a licen=
sed provider of money transfer services. All money transmission is provided=
 by PayPal, Inc. pursuant to <a href=3D"https://venmo.com/legal/us-licenses=
/" style=3D"color:#0074DE; text-decoration:none">PayPal, Inc.=E2=80=99s lic=
enses</a>.
                           =20
                        </div>
                      <p style=3D"color: #6B6E76; margin-top: 14px;">PayPal=
 is located at </p><p style=3D"color: #6B6E76;">2211 North First Street, Sa=
n Jose, CA 95131</p>
                        <div style=3D"margin-top: 5px;">
                           =20
                           =20
                                <div style=3D"font-size: smaller; margin-to=
p: 20px;">For security reasons, you cannot unsubscribe from payment emails.=
</div>
                           =20
                        </div>
                       =20
                    </div>
                </div>
               =20
               =20
            </div>
        </div>
    </body>
</html>

    `);
  console.log(result);
}
