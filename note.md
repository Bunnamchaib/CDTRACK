# Project Notes

## 2026-06-01 10:48:12
- ทำอะไรไป: ตั้งค่าโปรเจกต์หลักที่ `C:\Users\dekso\OneDrive\เดสก์ท็อป\Cradit Tracking`, อ่าน `DevRoule.md`, อ่าน `prompt.txt`, ตรวจโฟลเดอร์ `Design`, และคัดลอก `backup.py` จาก `C:\Users\dekso\OneDrive\เดสก์ท็อป\cost v3\backup.py` มาไว้ในโปรเจกต์แล้ว
- ปัญหาที่พบ: ความต้องการใน `prompt.txt` เป็นโปรเจกต์ full-stack ใหญ่ (React/Node/Prisma) แต่คำสั่งล่าสุดต้องการส่งมอบหลัก ๆ แค่ `index.html` และ `code.gs` สูงสุด 2-3 ไฟล์ จึงมีเงื่อนไขขัดกันและต้องยึดคำสั่งล่าสุดเป็นหลัก
- แก้อย่างไร/แนวทาง: จะใช้กติกาจาก `DevRoule.md` แบบ inspect first, patch second และจะสรุปความเข้าใจก่อนเริ่มเขียนโค้ด
- ทำต่อ: ยืนยันขอบเขตงานสุดท้าย, อ่านดีไซน์อ้างอิงให้ครบ, แล้วค่อยรัน `backup.py` ก่อนแก้โค้ดทุกครั้งในรอบถัดไป

## 2026-06-01 10:49:39
- Done: checked `backup.py` flow and reviewed the reference UI screens in `Design`
- Problem: `backup.py` is a Tkinter GUI backup tool, so before code edits the correct run step should be from project folder, not from the old source folder
- Fix/Plan: next coding round will start by running `python backup.py` inside `C:\Users\dekso\OneDrive\เดสก์ท็อป\Cradit Tracking`
- Next: keep the Obsidian dark UI direction and build within the 2-3 file limit

## 2026-06-01 10:54:55
- ทำอะไรไป: ยืนยันให้ใช้โฟลเดอร์ `C:\Users\dekso\OneDrive\เดสก์ท็อป\Cradit Tracking` เป็น Main Project, อ่าน `C:\Users\dekso\OneDrive\เดสก์ท็อป\cost v3\DevRoule.md`, อ่าน `prompt.txt`, ตรวจไฟล์อ้างอิงใน `Design`, และคัดลอก `backup.py` จาก `cost v3` มาไว้ใน Main Project อีกครั้งตามกติกา
- ปัญหา: ขอบเขตความต้องการเดิมใน `prompt.txt` เป็น full-stack ขนาดใหญ่ แต่คำสั่งล่าสุดต้องการงานจริงแบบไฟล์น้อยสุด โดยหลักคือ `index.html` และ `code.gs` และรวมแล้วไม่เกิน 3-5 ไฟล์
- แก้อย่างไร: จะยึดคำสั่งล่าสุดเป็นขอบเขตหลัก, ใช้ดีไซน์จาก `Design` เป็นหน้าตาอ้างอิง, และยังไม่เขียนโค้ดจนกว่าจะสรุปความเข้าใจตรงกันก่อน
- ทำต่อ: รอบถัดไปก่อนแก้โค้ดจะรัน `backup.py` ในโฟลเดอร์ Main Project ก่อนเสมอ แล้วค่อยเริ่มออกแบบโครง `index.html` + `code.gs` + การสร้างตาราง/ข้อมูลดัมมี่ตามที่ต้องการ

## 2026-06-01 11:10:51
- ทำอะไรไป: รัน `python backup.py` จากโฟลเดอร์ Main Project ก่อนแก้โค้ด, สร้าง `code.gs`, `index.html`, และ `appsscript.json`, ทำ Google Apps Script Web App แบบหน้าเดียวตามดีไซน์ Obsidian, และให้ `code.gs` สร้างชีต `Cards`, `Transactions`, `Payments`, `Installments`, `Alerts`, `Settings` พร้อมข้อมูลดัมมี่ได้
- ปัญหา: ต้องย่อ requirement ใหญ่จาก full-stack เดิมให้เหลือเวอร์ชัน GAS ที่ยังใช้งานได้จริงในไฟล์หลักไม่กี่ไฟล์ และต้องระวัง logic คำนวณรายงาน/alert ให้ไม่เพี้ยน
- แก้อย่างไร: รวม backend logic ไว้ใน `code.gs`, รวม UI/CSS/JS ไว้ใน `index.html`, ทำระบบ dashboard/cards/add transaction/reports/settings ในหน้าเดียว, และเช็ก syntax พื้นฐานของ `code.gs` กับ script ใน `index.html` แล้วผ่าน
- ทำต่อ: รอบถัดไปให้เอาไฟล์ไปวางใน Apps Script, กดรัน `setupProject`, ทดสอบ Web App จริง, แล้วค่อยเก็บบั๊กหรือปรับ UI/flow เพิ่มตามการใช้งานจริง

## 2026-06-01 11:13:03
- ทำอะไรไป: ตั้ง git ในโฟลเดอร์ Main Project, ผูก remote ไปที่ `https://github.com/Bunnamchaib/CDTRACK.git`, commit ไฟล์หลัก `index.html`, `code.gs`, `appsscript.json`, `note.md`, และ push ขึ้น branch `main` เรียบร้อย
- ปัญหา: โฟลเดอร์งานเดิมยังไม่ใช่ git repo และ remote ปลายทางเป็น empty repository จึงต้องตั้ง repo ใหม่ให้ระวัง scope ของไฟล์ที่จะ push
- แก้อย่างไร: stage เฉพาะไฟล์งานส่งมอบหลัก ไม่เอา `Design`, `backup`, `prompt.txt` หรือไฟล์อื่นที่ไม่ใช่ตัว MVP ขึ้นไป, แล้ว push commit `84cb460`
- ทำต่อ: ถัดไปให้เปิด repo บน GitHub หรือดึงไฟล์ไปลง Apps Script เพื่อทดสอบ `setupProject` และ Web App จริง จากนั้นค่อยแก้บั๊กและ push รอบต่อไป

## 2026-06-01 11:22:38
- ทำอะไรไป: ตรวจลิงก์ Web App `https://script.google.com/macros/s/AKfycbwhMGjGgPmnnU4XTpMzEtF-58-wu1l8ExIGnzAJTZiQRytXjKssE9jR1J-f2IkKPHccnw/exec` และเช็กช่องทางอัปเดตผ่าน browser / terminal เพิ่ม
- ปัญหา: ตัว deploy ปัจจุบัน error ว่า `No HTML file named index was found. (line 15, file "รหัส")` แปลว่าฝั่ง Apps Script ที่ deploy อยู่ยังไม่มีไฟล์ `index` ตามที่ `doGet()` เรียกใช้ หรือยังไม่ได้อัปเดตโค้ดล่าสุดขึ้นไป และเครื่องนี้ยังไม่มี `clasp`/การเชื่อม Chrome session สำหรับเข้าไปแก้โปรเจ็กต์ Apps Script ตรง ๆ
- แก้อย่างไร: ยืนยันว่าโค้ดล่าสุดใน Main Project และบน GitHub มี `index.html` + `code.gs` ครบแล้ว ปัญหาหลักอยู่ที่ฝั่ง Apps Script project/deployment ไม่ใช่ไฟล์ใน repo
- ทำต่อ: ต้องเข้าถึง Apps Script editor ของโปรเจ็กต์นั้นก่อน แล้วค่อยอัปโหลด `index.html`, `code.gs`, `appsscript.json` และ redeploy Web App ใหม่

## 2026-06-01 11:26:59
- ทำอะไรไป: ตรวจ logic การสร้างข้อมูลตั้งต้นและการเชื่อม spreadsheet ใน `code.gs`, เพิ่มระบบเช็กสถานะการเชื่อมต่อ, เพิ่มฟังก์ชัน `runSetupAndCheck()` และ `getSystemStatus()`, ทำให้ระบบพยายามหา spreadsheet เดิมกลับมาได้ถ้า property หลุด, และทำให้ seed ข้อมูลเติมเฉพาะชีตที่ยังว่าง
- ปัญหา: flow เดิมมีโอกาสหลุดการเชื่อมกับ spreadsheet เดิมหลัง deploy/ย้ายโปรเจ็กต์ และถ้าการสร้างตารางค้างกลางทางอาจเหลือบางชีตว่าง ทำให้เหมือน setup ไม่สำเร็จ
- แก้อย่างไร: ปรับให้ `getAppData()` และ `setup` ตรวจ-ซ่อม-เติมข้อมูลอัตโนมัติ, เพิ่มสถานะ `systemStatus` ส่งกลับหน้าเว็บ, และเพิ่มปุ่ม `Check connection` กับ panel แสดงว่าแต่ละชีตถูกสร้างแล้วหรือยัง
- ทำต่อ: เอาโค้ดรอบนี้ขึ้น Apps Script, redeploy ใหม่, กด `Setup sheets + demo data` หรือ `Check connection`, แล้วดู panel ว่าชีต `Cards/Transactions/Payments/Installments/Alerts/Settings` ครบและมีจำนวนแถวตามคาดหรือไม่

## 2026-06-01 11:31:35
- ทำอะไรไป: แก้ `setupProject()` อีกรอบให้วิ่งเส้นทางตรงขึ้น, ตัด logic ค้นหา spreadsheet เดิมผ่าน `DriveApp` ออกจากเส้นทาง setup หลัก, และห่อ error ของ `setupProject` ให้คืนข้อความชัดขึ้น
- ปัญหา: การใช้ `DriveApp` ใน setup หลักอาจทำให้รันจาก editor แล้ว fail แบบกว้าง ๆ ได้ ทั้งที่ผู้ใช้แค่ต้องการสร้าง spreadsheet และชีตเริ่มต้น
- แก้อย่างไร: ให้ setup ใช้เฉพาะ `PropertiesService` + `SpreadsheetApp.openById()`/`SpreadsheetApp.create()` แล้วค่อย `initializeSheets_()` และ `ensureDemoData_()` โดยไม่แตะ Drive search ในจุดวิกฤต
- ทำต่อ: อัปเดต `code.gs` นี้ขึ้น Apps Script แล้วลองรัน `setupProject` ใหม่จาก editor ถ้ายัง error ให้ดูข้อความใหม่ที่ควรละเอียดขึ้นกว่าของเดิม แล้วส่งกลับมาเพื่อตามแก้ต่อ

## 2026-06-01 11:35:02
- ทำอะไรไป: แยก `setupProject()` ให้เป็นฟังก์ชันตั้งต้นแบบปลอดภัย ใช้สำหรับรันจาก Apps Script editor โดยตรง, ย้าย payload ใหญ่ไปอยู่ใน `runSetupAndCheck()`, และเพิ่ม `runSetupCore_()` เป็นแกนกลางของงาน setup
- ปัญหา: การให้ `setupProject()` สร้างชีตแล้วคำนวณ dashboard/reports/alerts ต่อทันทีอาจทำให้ error เกิดในส่วนที่ไม่เกี่ยวกับการสร้างตาราง แต่ผู้ใช้เห็นแค่ว่า setup พัง
- แก้อย่างไร: ให้ `setupProject()` คืนผลลัพธ์สั้น ๆ แค่สถานะ setup, spreadsheet URL/ID, system status และ steps ที่วิ่งผ่าน ส่วนหน้าเว็บยังใช้ `runSetupAndCheck()` ได้เหมือนเดิม
- ทำต่อ: อัปเดต `code.gs` เวอร์ชันนี้ขึ้น Apps Script แล้วรัน `setupProject` จาก editor ใหม่ ถ้าผ่านค่อยเปิด Web App แล้วค่อยกด `Setup sheets + demo data` ที่หน้าเว็บ

## 2026-06-01 11:45:00
- ทำอะไรไป: รีไรต์ `code.gs` ใหม่ทั้งไฟล์โดยโฟกัสให้ฟังก์ชัน `setupProject()` รันได้จริงก่อน, ลดความซับซ้อนของ backend, คง public functions ที่หน้าเว็บใช้ไว้ (`getAppData`, `runSetupAndCheck`, `saveCard`, `addTransaction`, `simulatePurchase`, `getSystemStatus`)
- ปัญหา: ฟังก์ชัน setup เดิมถูกแก้หลายรอบจนมีความเสี่ยงจาก logic แทรกเยอะเกินไป ทำให้จับต้นตอการสร้างชีต/ข้อมูลดัมมี่ไม่ชัดและแก้ยาก
- แก้อย่างไร: เริ่มใหม่ด้วยเส้นทาง setup ที่ตรงที่สุดคือ `getOrCreateProjectSpreadsheet_ -> ensureAllSheets_ -> ensureSeedData_ -> syncAlerts`, และให้ `setupProject()` คืนค่าเป็นข้อความสั้น ๆ สำหรับการรันจาก editor ส่วนหน้าเว็บใช้ `runSetupAndCheck()` แยกต่างหาก
- ทำต่อ: เอา `code.gs` ล่าสุดนี้ขึ้น Apps Script แล้วรัน `setupProject` ทันที ถ้าผ่านจะได้ spreadsheet/ตาราง/ข้อมูลดัมมี่ก่อน จากนั้นค่อยทดสอบหน้า Web App

## 2026-06-04 08:08:22
- ทำอะไรไป: แก้ `code.gs` รอบล่าสุดโดยตัดการ `JSON.stringify` object ที่มี `Spreadsheet` อยู่ภายในออกจาก `setupProject()`, เพิ่ม error wrapper ให้ฟังก์ชันหลักคืนข้อความชัดขึ้น, และให้ `setupProject()` คืน object ธรรมดาที่ serialize ได้จริง
- ปัญหา: setup มีโอกาสพังเองจากการ log/serialize object ภายใน Apps Script แม้ขั้นสร้าง spreadsheet กับชีตจะทำงานได้ ทำให้ผู้ใช้เห็นเหมือนฟังก์ชัน setup ใช้งานไม่ได้
- แก้อย่างไร: log เฉพาะข้อมูล plain object, ห่อ `try/catch` ใน `setupProject`, `runSetupAndCheck`, `getAppData`, `saveCard`, `addTransaction`, `simulatePurchase`, และใช้ `errorMessage_()` รวมข้อความ error ให้แคบและชัด
- ทำต่อ: อัปเดต `code.gs` เวอร์ชันนี้ขึ้น Apps Script แล้วรัน `setupProject` ใหม่ก่อน ถ้ายังผิดให้ดูข้อความ error ใหม่ที่ควรชัดขึ้นกว่าเดิมมาก

## 2026-06-04 08:17:02
- ทำอะไรไป: ปรับระบบให้หน้าเว็บรันผ่าน GitHub Pages ได้โดยใส่ Apps Script backend URL `https://script.google.com/macros/s/AKfycbyKPJDQUPM3a56YmqeFb7RFxRXNIMY-UO7HkEegayuY_pJji0S2NC02ZChr137u9a5b_Q/exec` ลงใน `index.html`, เปลี่ยน `callServer()` ให้ fallback ไปเรียก backend แบบ JSONP เมื่อไม่มี `google.script.run`, และเพิ่ม API router ใน `code.gs` ผ่าน `doGet(e)`/`doPost(e)` ที่รองรับ `action`
- ปัญหา: ถ้ารันหน้าเว็บจาก GitHub Pages ตรง ๆ จะใช้ `google.script.run` ไม่ได้ ทำให้ frontend เดิมไม่สามารถคุยกับ `.gs` backend ได้
- แก้อย่างไร: ให้ frontend เลือก 2 โหมดอัตโนมัติ คือ Apps Script runtime เดิมเมื่อเปิดผ่าน GAS และ JSONP API mode เมื่อเปิดผ่าน GitHub Pages พร้อมส่ง `action` และ `payload` ไปยัง backend URL ที่กำหนด
- ทำต่อ: ต้องเอา `code.gs` เวอร์ชันนี้ขึ้น Apps Script แล้ว redeploy URL เดิมให้ใช้โค้ดล่าสุด จากนั้นหน้าเว็บบน GitHub จะเรียก backend นี้ได้จริง

## 2026-06-04 08:21:18
- ทำอะไรไป: อัปเดต Apps Script backend URL ใน `index.html` จาก deploy เดิมเป็น `https://script.google.com/macros/s/AKfycbxGsJnvko3x-oRi3Mky1Gz2Tz-jB8wbpYvJ3WAyZwboSLsxWQA9juzreSi7Fnnw2Eky/exec`
- ปัญหา: หลัง redeploy แล้วหน้า GitHub ยังชี้ไป URL เก่า จึงต้องเปลี่ยนให้ frontend เรียก backend ตัวใหม่
- แก้อย่างไร: แก้ค่าคงที่ `APPS_SCRIPT_API_URL` ใน `index.html` ให้ใช้ URL deploy ล่าสุด
- ทำต่อ: push ขึ้น GitHub แล้วทดสอบหน้าเว็บจาก GitHub Pages ว่ายิงไป backend ใหม่ได้จริง
