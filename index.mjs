import fetch from 'node-fetch';
import { URLSearchParams } from 'url'
import * as cheerio from 'cheerio';
import express from 'express';
import cors from 'cors'
import fs from 'fs/promises'
const app = express()


class api {

    url = 'https://fallzabdesk.szabist.edu.pk/';
    cookie = null;

    setCookie(ck) {
        this.cookie = ck
    }
    async getAllCourseTaken() {
        const html = await this.get(this.url + 'Student/PreviousCourses.asp');
        const $ = cheerio.load(html);
        const courses = [];
        $('#frmCourseOutline table').each((index, element) => {
            const rowData = $(element).find('tr');
            if (rowData) {
                $(rowData).each((i, el) => {
                    const obj = {};
                    $('td.textColor', $(el)).each((index, element) => {
                        const value = $(element).text();
                        if (index == 1) {
                            obj.course = value;
                        }
                        if (index == 2) {
                            obj.instructor = value
                        }
                        if (index == 3) {
                            obj.semester = value
                        }
                        if (index == 4) {
                            obj.withClass = value
                        }
                    });
                    courses.push(obj)
                })
            }
        });
        return courses;
    }
    async getResult() {
        const html = await this.get(this.url + 'Student/StdViewSemesterResult.asp');
        const $ = cheerio.load(html);
        let currentCGPA = '';
        let transcriptCGPA = '';
        const form = $('form[name="StdViewSemesterResult"]');
        const form_url = form.attr('action');
        const select = form.find('select[name="cboSemester"]');
        const options = select.find('option');

        const selectValues = options.map((index, option) => ({
            value: $(option).attr('value'),
            text: $(option).text().trim()
        })).get();

        $('table').each((index, element) => {
            const rowData = $(element).find('td').text();
            if (rowData) {
                if (rowData?.includes('Current CGPA:')) {
                    const matches = rowData.match(/Current CGPA:\s*([\d.]+)/);
                    if (matches) {
                        currentCGPA = matches[1];
                    }
                }
                if (rowData?.includes('Provisional Transcript CGPA:')) {
                    const matches = rowData.match(/Provisional Transcript CGPA:\s*([\d.]+)/);
                    if (matches) {
                        transcriptCGPA = matches[1];
                    }
                }
            }
        });

        return {
            currentCGPA,
            transcriptCGPA,
            dropDown: selectValues,
            postURL: form_url
        }
    }
    async getProfile() {
        const html = await this.get(this.url + 'student.asp?ASIUUFGUFGF=2');
        const $ = cheerio.load(html);
        const username = $('.username-top').text();
        const dp = $('.dp-full').attr('src');
        return {
            username,
            dp
        }
    }
    async getCourses() {
        const html = await this.get(this.url + 'Student/QryCourseOutline.asp');
        const $ = cheerio.load(html);
        const tables = $('#frmCourseOutline');
        const rows = $('tr', tables);
        const data = [];
        rows.each((index, element) => {
            const row = $(element);
            const coursename = row.find('td:nth-child(2)').text();
            const classWith = row.find('td:nth-child(3)').text();
            const outlineHref = row.find('td:nth-child(4) a').attr('href');
            if (outlineHref) {
                const jsCode = outlineHref;

                // Extract the values using regular expressions
                const regex = /'([^']*)'/g;
                const values = [];

                let match;
                while ((match = regex.exec(jsCode)) !== null) {
                    values.push(match[1]);
                }

                console.log(values);
                data.push({
                    coursename,
                    classWith,
                    data: {
                        txtFac: values[1],
                        txtCou: values[4],
                        txtSem: values[2],
                        txtSec: values[3]
                    }
                });
            }

        });

        return data;

    }
    async getCourseAttendence(course) {
        const encodedParams = new URLSearchParams();
        encodedParams.set('txtCou', course.txtCou);
        encodedParams.set('txtSem', course.txtSem);
        encodedParams.set('txtSec', course.txtSec);
        encodedParams.set('txtFac', course.txtFac);

        const html = await this.post(this.url + 'Student/QryCourseAttendance.asp', encodedParams);
        const $ = cheerio.load(html);
        const lectures = [];

        $('table.textColor tr').each((index, element) => {
            if (index > 1) {
                const tds = $(element).find('td');
                const lectureNumber = $(tds[0]).text().trim();
                const lectureDate = $(tds[1]).text().trim();
                const attendanceStatus = $(tds[2]).text().trim();
                if (lectureNumber.length > 0 && lectureDate.length > 0 && attendanceStatus.length > 0) {
                    lectures.push({
                        number: lectureNumber,
                        date: lectureDate,
                        attendance: attendanceStatus
                    });
                }
            }
        });
        return lectures
    }
    async getCourseRecap(course) {
        const encodedParams = new URLSearchParams();
        encodedParams.set('txtCou', course.txtCou);
        encodedParams.set('txtSem', course.txtSem);
        encodedParams.set('txtSec', course.txtSec);
        encodedParams.set('txtFac', course.txtFac);

        const html = await this.post(this.url + 'Student/QryCourseRecapSheet.asp', encodedParams);
        const $ = cheerio.load(html);
        const table = $('table.textColor');
        const rows = table.find('tr');
        const data = [];
        const student = {};
        let isRow = false;
        rows.each((index, row) => {
            const rowData = $(row).find('td, th').map((index, cell) => $(cell).text().trim()).get();
            if (rowData[0] === 'Student') {
                const _std = rowData[1].split('-');
                student.name = _std[0];
                student.regno = _std[1];
                student.section = rowData[3];
                student.semester = rowData[5];
            }
            if (isRow && rowData.length == 3) {
                data.push({
                    label: rowData[0],
                    maxMarks: rowData[1],
                    obtainedMarks: rowData[2],
                });
            }
            if (rowData[0] === 'Marks Head') {
                isRow = true;
            }
        });
        console.log(data)
        return {
            student,
            data
        };
    }
    async getSemesterResult(input) {
        const encodedParams = new URLSearchParams();
        encodedParams.set('cboSemester', input.semester);
        encodedParams.set('cmdSubmit', 'Submit');
        const html = await this.post(this.url +"Student/"+ input.end_point, encodedParams)
        const $ = cheerio.load(html);
        const table = $('table.textcolor');
        const rows = table.find('tr.plo_rows');
        const courses = []

        rows.each((index, row) => {
            const courseName = $(row).find('td:nth-child(1)').text().trim();
            const creditHours = $(row).find('td:nth-child(2)').text().trim();
            const grade = $(row).find('td:nth-child(3)').text().trim();
            const gradePoints = $(row).find('td:nth-child(4)').text().trim();

            courses.push({
                courseName,
                creditHours,
                grade,
                gradePoints
            })
        });
        return courses;
    }
    async get(url) {
        if (this.cookie) {
            let options = {
                method: 'GET',
                headers: {
                    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                    'Content-Type': 'text/html',
                    cookie: this.cookie,
                    Referer: this.url,
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Mobile Safari/537.36'
                }
            };
            const req = await fetch(url, options)
            const html = await req.text();
            return html;
        } else {
            throw new Error('No Cookie is Set, Please Set Cookie first!!');
        }
    }
    async post(url, encodedParams) {
        if (this.cookie) {
            let options = {
                method: 'POST',
                headers: {
                    Accept: '*/*',
                    'User-Agent': 'Thunder Client (https://www.thunderclient.com)',
                    cookie: this.cookie,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: encodedParams
            };
            const res = await fetch(url, options);
            const html = await res.text()
            return html;
        } else {
            throw new Error('No Cookie is Set, Please Set Cookie first!!');
        }
    }
}

app.use(cors())
app.use(express.json())
const _api = new api();

app.get('/', (req, res) => {
    res.send(`<div>
    <h1>Server is Working</h1>
    <p>Send Request To Server on These Paths</p>
     <ul>
     <li>/profile</li>
     <li>/courses</li>
     <li>/courses/all</li>
     <li>/result</li>
     </ul>
    </div>`)
})

app.get('/profile', async function (req, res) {
    _api.setCookie(req.query.cookie);
    const profile = await _api.getProfile()
    res.json(profile)
})
app.get('/courses', async function (req, res) {
    _api.setCookie(req.query.cookie);
    const profile = await _api.getCourses()
    res.json(profile)
})
app.get('/courses/all', async function (req, res) {
    _api.setCookie(req.query.cookie);
    const profile = await _api.getAllCourseTaken()
    res.json(profile)
})
app.get('/result', async function (req, res) {
    _api.setCookie(req.query.cookie);
    const profile = await _api.getResult()
    res.json(profile)
})
app.get('/course/attendence', async function (req, res) {
    _api.setCookie(req.query.cookie);
    const attendence = await _api.getCourseAttendence({
        "txtFac": req.query.txtFac,
        "txtCou": req.query.txtCou,
        "txtSem": req.query.txtSem,
        "txtSec": req.query.txtSec
    })
    res.json(attendence)
})
app.get('/course/recap', async function (req, res) {
    _api.setCookie(req.query.cookie);
    const recap = await _api.getCourseRecap({
        "txtFac": req.query.txtFac,
        "txtCou": req.query.txtCou,
        "txtSem": req.query.txtSem,
        "txtSec": req.query.txtSec
    })
    res.json(recap)
})
app.get('/semester/result', async (req, res) => {
    _api.setCookie(req.query.cookie);
    const result = await _api.getSemesterResult({
        end_point: req.query.end_point,
        semester: req.query.semester
    })
    res.json(result)
})


app.listen(3000)


