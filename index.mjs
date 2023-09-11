import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import express from 'express';
import cors from 'cors'
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
            this.parsejs(outlineHref)
            data.push({
                coursename,
                classWith,
                outlineHref
            });
        });

        return data;

    }

    parsejs(str) {
        if (str) {
            const pattern = /javascript:chkSubmitFrm\('([^']*)','([^']*)','([^']*)','([^']*)','([^']*)'\)/;
            const matches = str.match(pattern);
            if (matches) {
                const parameter1 = matches[1];
                const parameter2 = matches[2];
                const parameter3 = matches[3];
                const parameter4 = matches[4];

                console.log("Parameter 1:", parameter1);
                console.log("Parameter 2:", parameter2);
                console.log("Parameter 3:", parameter3);
                console.log("Parameter 4:", parameter4);
            } else {
                console.log("No match found.");
            }
        }
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
            return 'No Cookie is Set, Please Set Cookie first!!'
        }
    }
}

app.use(cors())
app.use(express.json())
const _api = new api();

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

app.listen(3000)


