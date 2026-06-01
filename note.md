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
