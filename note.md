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
