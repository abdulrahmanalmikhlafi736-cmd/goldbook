const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const source=process.env.FACEBOOST_SOURCE;
function read(p){return fs.readFileSync(path.join(source,p),'utf8');}
test('developer footer is after the final settings section and outside collapsed categories',()=>{
 const s=read('app/src/main/java/com/almekhlafi/materialbook/ui/components/settings/SettingsContent.kt');
 assert.ok(s.lastIndexOf('DeveloperContactCard()')>s.lastIndexOf('SettingsSection('));
 assert.ok(s.indexOf('DeveloperContactCard()')<s.indexOf('if (isLogoutDialog)'));
 for(const folder of ['values','values-ar']){const xml=read('app/src/main/res/'+folder+'/fpro_developer.xml');assert.ok(xml.includes('تم التطوير بواسطة عبدالرحمن المخلافي 🧑🏻‍💻'));assert.ok(xml.includes('لمراسلة المطور اضغط هنا 🙋🏻'));}
});
test('contact uses only owner number, explicit WhatsApp/Business then HTTPS with no new permissions',()=>{
 const s=read('app/src/main/java/com/almekhlafi/materialbook/utils/DeveloperContact.kt');
 assert.ok(s.includes('const val PHONE = "967781764759"'));assert.ok(s.includes('whatsapp://send?phone=$PHONE'));
 assert.ok(s.indexOf('"com.whatsapp"')<s.indexOf('"com.whatsapp.w4b"'));assert.ok(s.indexOf('"com.whatsapp.w4b"')<s.indexOf('https://wa.me/$PHONE'));
 assert.ok(s.includes('ActivityNotFoundException'));assert.ok(s.includes('SecurityException'));assert.ok(!s.includes('loadUrl('));
});
