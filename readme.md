# Szabdesk Api

 A Simple api i created from my universtity Student Portal.

## test server
https://ruby-courageous-boa.cyclic.app/


## Methods

 GET /profile   - returns Student Name and Profile Image

 GET /courses   - returns Current Semester Courses
 
 GET /courses/all  - returns all courses taken so far
 
 GET /result  - returns current cgpa and Provisional Transcript CGPA

 GET /attendence - returns an array of Object { date : 'LEC DATE' , number : 'LEC NUMBER' , attendence : 'STATUS'  }


 ### Example 

  NOTE : Please Pass Cookie or Server will Crash .


 https://ruby-courageous-boa.cyclic.app/profile?cookie=YOUR_ACCOUNT_COOKIE


#### /attendence path
Pass the Cookie along with course detail
{
        "txtFac": string,
        "txtCou": string,
        "txtSem": string,
        "txtSec": string
}


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
