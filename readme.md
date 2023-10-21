# Szabdesk Api

 A Simple api i created from my universtity Student Portal.

## test server
https://ruby-courageous-boa.cyclic.app/

http://192.210.174.131:3000/


## Methods

 GET /profile   <br/>
 - returns Student Name and Profile Image

 GET /courses   <br/>
 - returns Current Semester Courses
 
 GET /courses/all  <br/>
 - returns all courses taken so far
 
 GET /result  <br/>
  - returns current cgpa and Provisional Transcript CGPA

 GET /course/attendence <br/>
 - returns an array of Object { date : 'LEC DATE' , number : 'LEC NUMBER' , attendence : 'STATUS'  }

 GET /course/recap <br/>
  - returns an Object
 
 GET /semester/result <br/>
  - returns an JSON

 ### Example 

  NOTE : Please Pass Cookie or Server will Crash .


 https://ruby-courageous-boa.cyclic.app/profile?cookie=YOUR_ACCOUNT_COOKIE


#### /course/attendence & /course/recap
Pass the Params Cookie along with course detail

```php
        "cookie" : string
        "txtFac": string,
        "txtCou": string,
        "txtSem": string,
        "txtSec": string
```


```js

 let headersList = {
 "Accept": "*/*",
 "Content-Type": "application/x-www-form-urlencoded"
}

let response = await fetch("/attendence?cookie=YOUR_COOKIE_HERE&txtFac=AsimRiaz&txtCou=2xxx&txtSem=1xxxx&txtSec=xx", { 
  method: "GET",
  headers: headersList
});

let data = await response.json();
console.log(data);
```

GET /semester/result
params 
```php
        "cookie" : string
        "end_point": string || 'StdViewSemesterResult.asp?sid=9xxxxx',
        "semester": string || '1-Fall++2020',
```
