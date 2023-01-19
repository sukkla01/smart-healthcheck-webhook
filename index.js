const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const app = express()
const db = require('./config')
const moment = require('moment')
moment.locale('th')
const path = require("path")
const port = process.env.PORT || 5004
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
const cron = require('node-cron')
const fs = require('fs');
const { now } = require('moment')
const { registerFont, createCanvas, loadImage } = require("canvas");
registerFont('./font/THSarabun Bold.ttf', { family: 'THSarabun' })
app.use("/images", express.static(path.join(__dirname, "images")))
const ping = require('ping');
const token = 'MO75iPVFp8P28S6Jksl0VlcFLate/izyOFOWgd5DeuvJo9692NGek0hrbyclgb0cDl+ZaASziDr5+bv2c3LRMIECTm+gCExZkfzvOUuxUtdj4YIWJcrN89L1Ad39iMF/7wmOQRPdj1mKt01/l151ZgdB04t89/1O/w1cDnyilFU='

//reply
app.get('/confirm/:userid/:vn', async (req, res) => {
    let userid = req.params.userid
    let vn = req.params.vn
    let dataQuery
    let sql = `SELECT hn,nextdate,r.queue,name 
    FROM diligent_queue_reserve   r
    LEFT JOIN diligent_queue_dep d ON d.id = r.dep::int
    WHERE vn_reserve = '${vn}'      `
    const response = await db.query(sql);
    if (response.rows.length > 0) {
        dataQuery = response.rows
    }


    let date = moment(dataQuery[0].nextdate).add(543, 'year').format('LL')

    let data = {
        to: userid,
        messages: [
            {
                type: 'text',
                text: `จองเรียบร้อยแล้ว   \nhn:${dataQuery[0].hn} \nวันที่นัด : ${date} \nแผนก : ${dataQuery[0].name} \nคิวที่ : ${dataQuery[0].queue}  \n***กรุณาเข้าเมนู ข้อมูลรายการนัด `
            }
        ]
    }
    request({
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer {${token}}`
        },
        url: 'https://api.line.me/v2/bot/message/push',
        method: 'POST',
        body: data,
        json: true
    }, async function (err, res, body) {
        if (err) console.log('error')
        if (res) {
            console.log('success')
        }
        if (body) console.log(body)
    })

    res.sendStatus(200)

})
app.post('/webhook', (req, res) => {
    let message = ''
    let tdate = ''
    let reply_token = req.body.events[0].replyToken
    let userId = ''
    if (req.body.events[0].type == 'message') {
        message = req.body.events[0].message.text
        userId = req.body.events[0].source.userId

    } else if (req.body.events[0].type == 'postback') {
        tdate = moment(req.body.events[0].postback.params.datetime).format('YYYY-MM-DD')
        message = 'date'
        console.log(req.body.events[0])
    }


    if (message == 'ตรวจสอบผลการตรวจ') {
        reply(reply_token, 1, userId)
    } else if (message == 'โปรแกรมตรวจสุขภาพ') {
        reply(reply_token, 2, userId)
    } else if (message == 'เพิ่มเติม') {
        reply(reply_token, 3, '')
    } else {
        reply(reply_token, 4, '')
    }

    res.sendStatus(200)
})


app.get('/test2', async (req, res) => {


    let url = 'https://api-queue-ss.diligentsoftinter.com/doctor/'
    let dataDoctor = [
        { image: '1.jpg', tname: 'พญ.กันต์กนก อัตถวิบูลย์', dep: 'แพทย์เฉพาะทาง หูคอจมูก' },
        { image: '2.jpg', tname: 'นพ.ธีรเศรษฐ์ บัณฑุชัย', dep: 'แพทย์เฉพาะทาง ออร์โธปิดิกส์' },
        { image: '3.jpg', tname: 'พญ.ลลิตา โฆษตวรกิจกุล', dep: 'สูติแพทย์' },
        { image: '4.jpg', tname: 'พญ.ปิยธิดา ภุมรา', dep: 'สูติแพทย์' },
        { image: '5.jpg', tname: 'นพ.รณชัย พูลล้น', dep: 'ศัลยแพทย์' },
        { image: '6.jpg', tname: 'พญ.สุจิตติ โชคไชยกุล', dep: 'ศัลยแพทย์' },
        { image: '7.jpg', tname: 'พญ.ภัทฐิชา ภิญโยสวัสดิ์สกุล', dep: 'จักษุแพทย์' },
    ]

    let dataShow = []

    dataDoctor.map((item, i) => {
        dataShow.push({
            "thumbnailImageUrl": url + item.image,
            "imageBackgroundColor": "#FFFFFF",
            "title": item.tname,
            "text": item.dep,
            "defaultAction": {
                "type": "uri",
                "label": "View detail",
                "uri": url + item.image
            },
            "actions": [
                {
                    "type": "uri",
                    "label": "View detail",
                    "uri": url + item.image
                }
            ]
        })
    })

    console.log(dataShow)

    // http.request('https://profile.line-scdn.net/0hT3ZidsHDCxx3EB8kre91YwdACHZUYVIOWXdAekJAUysYIkUfW3YQckEZBXxKd0xOWnRMKkUQBy17A3x6aUb3KHAgVStOJkxJXXdE_g', function(response) {                                        
    //     console.log(response)                                                                        
    //   }).end();


    // fs.unlinkSync( `./images/${d.vn_reserve}.png`)
    // fs.unlink(`./images/20220606112157.png`, function (err) {
    //     if (err) console.log(err);
    //     // if no error, file has been deleted successfully
    //     console.log('File deleted!');
    // });
    // let sql = `SELECT nextdate,d.id,d.name as dname,count(vn_reserve) AS tcount 
    // FROM diligent_queue_dep d
    // LEFT JOIN diligent_queue_reserve r ON r.dep::int = d.id AND nextdate = '2022-06-21'
    // GROUP BY nextdate,d.id,dname
    // ORDER BY d.id   `
    // const response = await db.query(sql);
    // if (response.rows.length > 0) {
    //     console.log(response.rows)
    //     createImageDoctor(response.rows)

    // }
})
// test push
app.get('/test', async (req, res) => {

    let sql = `SELECT qr.*,r.user_id,tel,r.cid,d.name AS dname,concat(p.fname,' ',p.lname) as tname
    FROM diligent_queue_reserve qr
    LEFT JOIN patient p ON p.hn = qr.hn
    LEFT JOIN diligent_queue_register  r ON r.cid = p.cid
    LEFT JOIN diligent_queue_dep d ON d.id = qr.dep::int
    where to_char(nextdate - INTERVAL '1 DAY', 'YYYY-mm-dd') = to_char(CURRENT_DATE,'YYYY-mm-dd')      `
    const response = await db.query(sql);
    if (response.rows.length > 0) {
        response.rows.map((item, i) => {
            console.log(item)
            createImage(item)
        })
    }

    res.sendStatus(200)
})


// cron.schedule('*/30 * * * * *', async function () {
//     pingT()
// })
cron.schedule('10 37 21 * * *', function () {
    console.log(new Date().toLocaleString());
});
// cron.schedule('* 36 21 * * *', function(){
//     console.log(new Date().toLocaleString());
// });


// ส่งเตือนนัด
// update opdscreen
cron.schedule('10 30 12 * * *', async function () {

    let DateTimeCur = new Date();
    let curdate = moment(DateTimeCur).format("YYYY-MM-DD")
    let curdate_tmp = moment(DateTimeCur).format("HH:mm:ss")
    let timeC = moment(DateTimeCur).format("HH:mm")
    let sql = `SELECT qr.*,r.user_id,tel,r.cid,d.name AS dname,concat(p.fname,' ',p.lname) as tname
            FROM diligent_queue_reserve qr
            LEFT JOIN patient p ON p.hn = qr.hn
            LEFT JOIN diligent_queue_register  r ON r.cid = p.cid
            LEFT JOIN diligent_queue_dep d ON d.id = qr.dep::int
            where to_char(nextdate - INTERVAL '1 DAY', 'YYYY-mm-dd') = to_char(CURRENT_DATE,'YYYY-mm-dd')      `
    const response = await db.query(sql);
    if (response.rows.length > 0) {
        response.rows.map((item, i) => {
            createImage(item)
        })
    }
});
//////// end
cron.schedule('10 30 17 * * *', async function () {

    let DateTimeCur = new Date();
    let curdate = moment(DateTimeCur).format("YYYY-MM-DD")
    let curdate_tmp = moment(DateTimeCur).format("HH:mm:ss")
    let timeC = moment(DateTimeCur).format("HH:mm")
    let sql = `SELECT qr.*,r.user_id,tel,r.cid,d.name AS dname,concat(p.fname,' ',p.lname) as tname
            FROM diligent_queue_reserve qr
            LEFT JOIN patient p ON p.hn = qr.hn
            LEFT JOIN diligent_queue_register  r ON r.cid = p.cid
            LEFT JOIN diligent_queue_dep d ON d.id = qr.dep::int
            where to_char(nextdate - INTERVAL '1 DAY', 'YYYY-mm-dd') = to_char(CURRENT_DATE,'YYYY-mm-dd')      `
    const response = await db.query(sql);
    if (response.rows.length > 0) {
        response.rows.map((item, i) => {
            createImage(item)
        })
    }
});



app.listen(port)

// สร้างบัตรนัด
function createImage(data) {
    console.log('3')

    var fileName = './images/appcard.jpeg';
    var imageCaption = 'Image caption';
    var loadedImage;


    const width = 400;
    const height = 550;
    const canvas = createCanvas(width, height);

    const context = canvas.getContext("2d");
    context.fillStyle = "yellow";
    context.fillRect(0, 0, width, height);


    context.fillStyle = "#000";
    context.font = "THSarabun";
    context.textAlign = "center";
    context.fillText("Hello, World!", 400, 120);

    context.fillStyle = "#fff";
    context.fillRect(400, 200, 300, 200);

    loadImage(fileName).then((image) => {

        context.drawImage(image, 0, 0);
        context.fillStyle = "#FFF";
        context.font = "20px THSarabun";
        context.textAlign = "Left";
        context.fillText(`บัตรนัดโรงพยาบาลศรีสังวรสุโขทัย`, 280, 30);
        context.fillText(`SrisangwornSMC`, 325, 50);
        context.font = "30px THSarabun";
        context.fillStyle = "#000";
        context.fillText(`ชื่อ-สกุล : ${data.tname}`, 220, 270);
        context.fillText(`HN : ${data.hn}`, 220, 310);
        context.fillText(`วันที่นัด : ${moment(data.nextdate).add(543, 'year').format('LL')}`, 220, 350);
        context.fillText(`แผนก : ${data.dname}`, 220, 390);

        const buffer = canvas.toBuffer("image/png");
        fs.writeFileSync(`./images/${data.vn_reserve}.png`, buffer);
    });

    sendText(data)

}
// สร้างรายการจำนวนนัด
// async function createImageDoctor(tdate) {
//     console.log('3')

// let data

// let sql = `SELECT nextdate,d.id,d.name as dname,count(vn_reserve) AS tcount 
// FROM diligent_queue_dep d
// LEFT JOIN diligent_queue_reserve r ON r.dep::int = d.id AND nextdate = '${tdate}'
// GROUP BY nextdate,d.id,dname
// ORDER BY d.id   `
// const response = await db.query(sql);
// if (response.rows.length > 0) {
//     console.log(response.rows)
//     data = response.rows
//     // createImageDoctor(response.rows)
// }

// var fileName = './images/doctor_app.png';
// var imageCaption = 'Image caption';
// var loadedImage;


// const width = 300;
// const height = 250;
// const canvas = createCanvas(width, height);

// const context = canvas.getContext("2d");
// context.fillStyle = "yellow";
// context.fillRect(0, 0, width, height);


// context.fillStyle = "#000";
// context.font = "THSarabun";
// context.textAlign = "center";
// context.fillText("Hello, World!", 400, 120);

// context.fillStyle = "#fff";
// context.fillRect(400, 200, 300, 200);

// loadImage(fileName).then((image) => {

//     context.drawImage(image, 0, 0);
//     context.fillStyle = "#000";
//     context.font = "18px THSarabun";
//     context.textAlign = "left";
//     context.fillText(`วันที่ 21 มิย. 2564`, 95, 60);
//     // context.fillText(`SrisangwornSMC`, 325, 50);
//     context.font = "20px THSarabun";
//     context.fillStyle = "#000";

//     let theigth = 75
//     data.map((item, i) => {
//         theigth = theigth +25
//         return context.fillText(`${i + 1}.${item.dname}  จำนวน ${item.tcount} คน`, 50, theigth,);

//     })

//     // context.fillText(`1.โสต ศอ นาสิก  จำนวน 3 คน`, 50, 100,);
//     // context.fillText(`2.จักษุวิทยา  จำนวน 13 คน`, 50, 125);
//     // context.fillText(`3.ออร์โธปิดิกส์  จำนวน 3 คน`, 50, 150);
//     // context.fillText(`4.ศัลยกรรม  จำนวน 3 คน`, 50, 175);
//     // context.fillText(`5.สูตินรีเวช  จำนวน 3 คน`, 50, 200);
//     // context.fillText(`HN : ${data.hn}`, 220, 310);
//     // context.fillText(`วันที่นัด : ${moment(data.nextdate).add(543, 'year').format('LL')}`, 220, 350);
//     // context.fillText(`แผนก : ${data.dname}`, 220, 390);

//     const buffer = canvas.toBuffer("image/png");
//     fs.writeFileSync(`./images/d.png`, buffer);
// });


//     let data2 = {
//         "type": "image",
//         "originalContentUrl": `https://linebot-swhospital.diligentsoftinter.com/images/d.png`,
//         "previewImageUrl": `https://linebot-swhospital.diligentsoftinter.com/images/d.png`
//     }



//     return data2


// }

// ตอบ reply
async function reply(reply_token, type, userID) {
    let headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer {${token}}`
    }
    let reply_tmp
    if (type == 1) {
        reply_tmp = [await FlexResult(userID)]
        // reply_tmp = [Warning()]
    } else if (type == 2) {
        reply_tmp = [imageList1()]
        // reply_tmp = [Warning()]
    } else if (type == 3) {
        reply_tmp = [quickMenu()]
    } else if (type == 5) {
        reply_tmp = [datePicker()]
    } else if (type == 6) {
        reply_tmp = [imageDoctor(date)]
    } else if (type == 7) {
        reply_tmp = [await profile(date)]
    } else if (type == 8) {
        reply_tmp = [flexProblem(date)]
    } else {
        reply_tmp = [other()]
    }

    console.log(reply_tmp)
    let body = JSON.stringify({
        replyToken: reply_token,
        messages: reply_tmp
    })
    request.post({
        url: 'https://api.line.me/v2/bot/message/reply',
        headers: headers,
        body: body
    }, (err, res, body) => {
        // console.log(res);
    });


}





//push message
async function sendText(d) {
    let data = {
        to: d.user_id,
        messages: [
            imageAlertOapp(d.vn_reserve)

            // flexMulti() 
        ]
    }
    request({
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer {${token}}`
        },
        url: 'https://api.line.me/v2/bot/message/push',
        method: 'POST',
        body: data,
        json: true
    }, async function (err, res, body) {
        if (err) console.log('error')
        if (res) {
            console.log('success')

            // await sleep(5000);
            // fs.unlink(`./images/${d.vn_reserve}.png`, function (err) {
            //     if (err) console.log(err);
            //     // if no error, file has been deleted successfully
            //     console.log('File deleted!');
            // });
            // console.log('xxx');
        }
        if (body) console.log(body)
    })


}


function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}


async function queryProfile(userId) {
    let sql = `SELECT r.cid,r.tel,r.picture,
    concat(p.pname,p.fname,' ',p.lname) AS tname,
    p.hn,to_char(CURRENT_DATE,'YYYY')::int - to_char(p.birthday,'YYYY')::int AS tage
    FROM diligent_queue_register r
    LEFT JOIN patient p ON p.cid = r.cid
    WHERE user_id ='${userId}'  limit 1   `
    const response = await db.query(sql);
    if (response.rows.length > 0) {
        return response.rows[0]
    }
}



const profile = async (userId) => {

    // let tname =''
    // var tmp

    const d = await queryProfile(userId)

    // console.log('------')
    console.log(d)
    // console.log('profile')
    let cid = d.cid.substring(0, 6) + "xxxxx" + d.cid.substring(11, 13)

    let data = {
        "type": "flex",
        "altText": "ข้อมูลส่วนตัว",
        "contents": {
            "type": "bubble",
            "body": {
                "type": "box",
                "layout": "vertical",
                "spacing": "md",
                "contents": [
                    {
                        "type": "image",
                        "url": "https://sv1.picz.in.th/images/2021/08/03/2QuP1Z.png",
                        "size": "full",
                        "aspectRatio": "20:13",
                        "aspectMode": "cover",
                        "animated": true
                    },
                    {
                        "type": "box",
                        "layout": "vertical",
                        "contents": [
                            {
                                "type": "image",
                                "url": d.picture,
                                "size": "full"
                            }
                        ],
                        "width": "100px",
                        "height": "100px",
                        "cornerRadius": "150px",
                        "position": "absolute",
                        "offsetStart": "100px",
                        "offsetTop": "130px",
                        "borderWidth": "3px",
                        "borderColor": "#ffffff"
                    },
                    {
                        "type": "text",
                        "text": "ชื่อ-สกุล : " + d.tname,
                        "size": "lg",
                        "weight": "bold",
                        "margin": "50px",
                        "wrap": true,
                        "align": "center",
                        "color": "#ffffff"
                    },
                    {
                        "type": "text",
                        "text": "HN : " + d.hn,
                        "size": "lg",
                        "weight": "bold",
                        "margin": "10px",
                        "wrap": true,
                        "align": "center",
                        "color": "#ffffff"
                    },
                    {
                        "type": "text",
                        "text": "CID : " + cid,
                        "size": "lg",
                        "weight": "bold",
                        "margin": "10px",
                        "wrap": true,
                        "align": "center",
                        "color": "#ffffff"
                    },
                    {
                        "type": "text",
                        "text": "อายุ : " + d.tage + " ปี",
                        "size": "lg",
                        "weight": "bold",
                        "margin": "10px",
                        "wrap": true,
                        "align": "center",
                        "color": "#ffffff"
                    },
                    // {
                    //     "type": "box",
                    //     "layout": "vertical",
                    //     "spacing": "sm",
                    //     "contents": [
                    //         {
                    //             "type": "box",
                    //             "layout": "baseline",
                    //             "contents": [
                    //                 // {
                    //                 //     "type": "icon",
                    //                 //     "url": "https://media-public.canva.com/Kt-FM/MADIT2Kt-FM/2/tl.png",
                    //                 //     "offsetTop": "5px"
                    //                 // },
                    //                 {
                    //                     "type": "text",
                    //                     "text": "จำนวนการจอง",
                    //                     "weight": "bold",
                    //                     "margin": "sm",
                    //                     "flex": 0,
                    //                     "color": "#ffffff"
                    //                 },
                    //                 {
                    //                     "type": "text",
                    //                     "text": "300",
                    //                     "align": "end",
                    //                     "color": "#daff7d",
                    //                     "weight": "bold"
                    //                 }
                    //             ]
                    //         },
                    //         {
                    //             "type": "box",
                    //             "layout": "baseline",
                    //             "contents": [
                    //                 {
                    //                     "type": "icon",
                    //                     "url": "https://media-public.canva.com/AwS70/MAE0wAAwS70/1/tl.png",
                    //                     "offsetTop": "6px"
                    //                 },
                    //                 {
                    //                     "type": "text",
                    //                     "text": "ยอดการแชร์กิจกรรม",
                    //                     "weight": "bold",
                    //                     "margin": "sm",
                    //                     "flex": 0,
                    //                     "color": "#ffffff"
                    //                 },
                    //                 {
                    //                     "type": "text",
                    //                     "text": "5  ครั้ง",
                    //                     "align": "end",
                    //                     "color": "#daff7d",
                    //                     "weight": "bold"
                    //                 }
                    //             ]
                    //         }
                    //     ]
                    // },
                    // {
                    //     "type": "text",
                    //     "text": "ยอดการแชร์จะเกิดขึ้นได้ถ้าเพื่อนแชร์กิจกรรมต่อให้",
                    //     "wrap": true,
                    //     "color": "#aaaaaa",
                    //     "size": "xxs"
                    // },
                    // {
                    //     "type": "text",
                    //     "text": "ระยะเวลาดูเซ็ทฟรี ถ้าครบ 100% ถือว่าหมดเวลา หากต้องการดูต่อติดต่อ iton5\nเวลาล่าสุด : ",
                    //     "color": "#ffffff",
                    //     "align": "start",
                    //     "gravity": "center",
                    //     "size": "xs",
                    //     "wrap": true
                    // },
                    // {
                    //     "type": "text",
                    //     "text": "50 %",
                    //     "color": "#ffffff",
                    //     "align": "start",
                    //     "size": "xs",
                    //     "gravity": "center",
                    //     "margin": "lg"
                    // },
                    // {
                    //     "type": "box",
                    //     "layout": "vertical",
                    //     "contents": [
                    //         {
                    //             "type": "box",
                    //             "layout": "vertical",
                    //             "contents": [
                    //                 {
                    //                     "type": "filler"
                    //                 }
                    //             ],
                    //             "width": "50%",
                    //             "backgroundColor": "#daff7d",
                    //             "height": "6px"
                    //         }
                    //     ],
                    //     "backgroundColor": "#FAD2A76E",
                    //     "height": "6px",
                    //     "margin": "sm"
                    // },
                    // {
                    //     "type": "box",
                    //     "layout": "vertical",
                    //     "contents": [
                    //         {
                    //             "type": "button",
                    //             "style": "primary",
                    //             "color": "#905c44",
                    //             "action": {
                    //                 "type": "uri",
                    //                 "label": "แชร์กิจกรรม 🎉",
                    //                 "uri": "https://google.com"
                    //             },
                    //             "height": "sm"
                    //         }
                    //     ],
                    //     "maxWidth": "190px",
                    //     "offsetStart": "50px",
                    //     "margin": "lg"
                    // }
                ],
                "paddingAll": "10px",
                "backgroundColor": "#000000"
            }
        }
    }

    return data
}

function other() {

    let data = {
        type: 'text',
        text: `ติดต่อสอบถามได้ที่ 096-978-3574 `
    }



    return data
}

function Warning() {

    let data = {
        type: 'text',
        text: `กำลังพัฒนา`
    }



    return data
}

function datePicker() {
    let text = moment().format()
    let date_c = text.toString().substring(0, 16)
    console.log(text.toString().substring(0, 16))
    let data = {
        "type": "text",
        "text": "เลือกวันที่",
        "quickReply": {
            "items": [
                {
                    "type": "action",
                    "action": {
                        "type": "datetimepicker",
                        "label": "คลิกเพื่อเลือกวันที่",
                        "data": "storeId=12345",
                        "mode": "datetime",
                        "initial": date_c,
                        "max": "2024-12-31T23:59",
                        "min": "2021-01-01T00:00"
                    }
                }
            ]
        }
    }



    return data
}
function quickMenu() {

    let data = {
        "type": "text", // ①
        "text": "กรุณาเลือกเมนู",
        "quickReply": { // ②
            "items": [
                {
                    "type": "action", // ③
                    "imageUrl": "https://linebot-swhospital.diligentsoftinter.com/images/user.png",
                    "action": {
                        "type": "message",
                        "label": "ข้อมูลส่วนตัว",
                        "text": "ข้อมูลส่วนตัว"
                    }
                },
                {
                    "type": "action",
                    "imageUrl": "https://linebot-swhospital.diligentsoftinter.com/images/doctor.png",
                    "action": {
                        "type": "message",
                        "label": "จำนวนการจอง",
                        "text": "จำนวนการจอง"
                    }
                },
                {
                    "type": "action",
                    "imageUrl": "https://api-queue-ss.diligentsoftinter.com/service.png",
                    "action": {
                        "type": "message",
                        "label": "แจ้งปัญหา",
                        "text": "แจ้งปัญหา"
                    }
                },
                {
                    "type": "action",
                    "imageUrl": "https://linebot-swhospital.diligentsoftinter.com/images/smc.jpg",
                    "action": {
                        "type": "message",
                        "label": "เกี่ยวกับ smc",
                        "text": "เกี่ยวกับ smc"
                    }
                },

            ]
        }
    }



    return data
}
function imageAlertOapp(vn) {
    console.log(vn)
    let data = {
        "type": "image",
        "originalContentUrl": `https://linebot-swhospital.diligentsoftinter.com/images/${vn}.png`,
        "previewImageUrl": `https://linebot-swhospital.diligentsoftinter.com/images/${vn}.png`
    }



    return data
}

async function createImageDoctor(tdate) {
    let dateShow = moment(tdate).add(543, 'year').format('LL');
    let data2
    let sql = `SELECT nextdate,d.id,d.name as dname,count(vn_reserve) AS tcount 
    FROM diligent_queue_dep d
    LEFT JOIN diligent_queue_reserve r ON r.dep::int = d.id AND nextdate = '${tdate}'
    GROUP BY nextdate,d.id,dname
    ORDER BY d.id   `
    const response = await db.query(sql);
    if (response.rows.length > 0) {
        console.log(response.rows)
        data2 = response.rows
        // createImageDoctor(response.rows)
    }

    var fileName = './images/doctor_app.png';
    var imageCaption = 'Image caption';
    var loadedImage;


    const width = 300;
    const height = 250;
    const canvas = createCanvas(width, height);

    const context = canvas.getContext("2d");
    context.fillStyle = "yellow";
    context.fillRect(0, 0, width, height);


    context.fillStyle = "#000";
    context.font = "THSarabun";
    context.textAlign = "center";
    context.fillText("Hello, World!", 400, 120);

    context.fillStyle = "#fff";
    context.fillRect(400, 200, 300, 200);

    loadImage(fileName).then((image) => {

        context.drawImage(image, 0, 0);
        context.fillStyle = "#000";
        context.font = "18px THSarabun";
        context.textAlign = "left";
        context.fillText(`วันที่ ${dateShow}`, 95, 60);
        // context.fillText(`SrisangwornSMC`, 325, 50);
        context.font = "20px THSarabun";
        context.fillStyle = "#000";

        let theigth = 75
        data2.map((item, i) => {
            theigth = theigth + 25
            return context.fillText(`${i + 1}.${item.dname}  จำนวน ${item.tcount} คน`, 50, theigth,);

        })

        // context.fillText(`1.โสต ศอ นาสิก  จำนวน 3 คน`, 50, 100,);
        // context.fillText(`2.จักษุวิทยา  จำนวน 13 คน`, 50, 125);
        // context.fillText(`3.ออร์โธปิดิกส์  จำนวน 3 คน`, 50, 150);
        // context.fillText(`4.ศัลยกรรม  จำนวน 3 คน`, 50, 175);
        // context.fillText(`5.สูตินรีเวช  จำนวน 3 คน`, 50, 200);
        // context.fillText(`HN : ${data.hn}`, 220, 310);
        // context.fillText(`วันที่นัด : ${moment(data.nextdate).add(543, 'year').format('LL')}`, 220, 350);
        // context.fillText(`แผนก : ${data.dname}`, 220, 390);

        const buffer = canvas.toBuffer("image/png");
        fs.writeFileSync(`./images/d.png`, buffer);
    });

}

// health check
function flexResultxxxx() {

    let url = 'https://api-queue-ss.diligentsoftinter.com/doctor/'
    let dataDoctor = [
        { image: '.jpg', tname: 'รายงานผลการตรวจสุขภาพ', dep: 'สามารถเข้าดูรายละเอียดได้ด้านล่าง' },

    ]

    let dataShow = []

    dataDoctor.map((item, i) => {
        dataShow.push({
            "thumbnailImageUrl": url + item.image,
            "imageBackgroundColor": "#FFFFFF",
            "title": item.tname,
            "text": item.dep,
            "defaultAction": {
                "type": "uri",
                "label": "View detail",
                "uri": url + item.image
            },
            "actions": [
                {
                    "type": "uri",
                    "label": "รายละเอียด",
                    "uri": url + item.image
                }
            ]
        })
    })


    let data = {
        "type": "template",
        "altText": "this is a carousel template",
        "template": {
            "type": "carousel",
            "columns": dataShow,
            "imageAspectRatio": "rectangle",
            "imageSize": "cover"
        }
    }

    return data
}
///

function imageDoctor(tdate) {


    createImageDoctor(tdate)

    let data = {
        "type": "image",
        "originalContentUrl": `https://linebot-swhospital.diligentsoftinter.com/images/d.png`,
        "previewImageUrl": `https://linebot-swhospital.diligentsoftinter.com/images/d.png`
    }
    return data
}

function imageList1() {
    let data = {
        "type": "image",
        "originalContentUrl": `https://api-smart-healthcheck.diligentsoftinter.com/program.jpg`,
        "previewImageUrl": `https://api-smart-healthcheck.diligentsoftinter.com/program.jpg`
    }
    return data
}

function imageList2() {
    let data = {
        "type": "image",
        "originalContentUrl": `https://linebot-swhospital.diligentsoftinter.com/images/list12.png`,
        "previewImageUrl": `https://linebot-swhospital.diligentsoftinter.com/images/list12.png`
    }
    return data
}
function imageList3() {
    let data = {
        "type": "image",
        "originalContentUrl": `https://linebot-swhospital.diligentsoftinter.com/images/list13.png`,
        "previewImageUrl": `https://linebot-swhospital.diligentsoftinter.com/images/list13.png`
    }
    return data
}



function videoV1() {
    let data = {
        "type": "video",
        "originalContentUrl": "https://api-queue-ss.diligentsoftinter.com/doctor/V1.mp4",
        "previewImageUrl": "https://api-queue-ss.diligentsoftinter.com/doctor/v1.jpg",
        "trackingId": "track-id"
    }

    return data
}


function flexMultiDoctor() {

    let url = 'https://api-queue-ss.diligentsoftinter.com/doctor/'
    let dataDoctor = [
        // { image : '1.jpg',tname: 'พญ.กันต์กนก อัตถวิบูลย์' ,dep : 'แพทย์เฉพาะทาง หูคอจมูก' },
        { image: 'main.jpg', tname: 'คลินิกพิเศษ', dep: 'คลินิกพิเศษเฉพาะทางนอกเวลาราชการ' },
        { image: '12.jpg', tname: 'นพ.จุมภฎ โสตถิถาวร', dep: 'แพทย์เฉพาะทาง ระบบทางเดินปัสสาวะ' },
        { image: '11.jpg', tname: 'นพ.วรมิฎฐ์ ซื่อสัจจพงษ์', dep: 'แพทย์เฉพาะทาง ออร์โธปิดิกส์' },
        { image: '2.jpg', tname: 'นพ.ธีรเศรษฐ์ บัณฑุชัย', dep: 'แพทย์เฉพาะทาง ออร์โธปิดิกส์' },
        { image: '3.jpg', tname: 'พญ.ลลิตา โฆษตวรกิจกุล', dep: 'สูติแพทย์' },
        { image: '4.jpg', tname: 'พญ.ปิยธิดา ภุมรา', dep: 'สูติแพทย์' },

        // { image : '13.jpg',tname: 'พญ.กันต์กนก อัตถวิบูลย์' ,dep : 'หูคอจมูก' },
    ]

    let dataShow = []

    dataDoctor.map((item, i) => {
        dataShow.push({
            "thumbnailImageUrl": url + item.image,
            "imageBackgroundColor": "#FFFFFF",
            "title": item.tname,
            "text": item.dep,
            "defaultAction": {
                "type": "uri",
                "label": "View detail",
                "uri": url + item.image
            },
            "actions": [
                {
                    "type": "uri",
                    "label": "รายละเอียด",
                    "uri": url + item.image
                }
            ]
        })
    })


    let data = {
        "type": "template",
        "altText": "this is a carousel template",
        "template": {
            "type": "carousel",
            "columns": dataShow,
            "imageAspectRatio": "rectangle",
            "imageSize": "cover"
        }
    }

    return data
}

function flexMultiDoctor2() {

    let url = 'https://api-queue-ss.diligentsoftinter.com/doctor/'
    let dataDoctor = [
        { image: '10.jpg', tname: 'นพ.กุศล ทองอรุณศรี', dep: 'จักษุแพทย์' },
        { image: '5.jpg', tname: 'นพ.รณชัย พูลล้น', dep: 'ศัลยแพทย์' },
        { image: '6.jpg', tname: 'พญ.สุจิตติ โชคไชยกุล', dep: 'ศัลยแพทย์' },
        { image: '7.jpg', tname: 'พญ.ภัทฐิชา ภิญโยสวัสดิ์สกุล', dep: 'จักษุแพทย์' },
        { image: '8.jpg', tname: 'นพ.นาวิน ศักดาเดช', dep: 'สูติแพทย์' },
        { image: '9.jpg', tname: 'นพ.นรุตม์ชัย พัฒนะดำรงชัย', dep: 'อายุรกรรม' },

    ]

    let dataShow = []

    dataDoctor.map((item, i) => {
        dataShow.push({
            "thumbnailImageUrl": url + item.image,
            "imageBackgroundColor": "#FFFFFF",
            "title": item.tname,
            "text": item.dep,
            "defaultAction": {
                "type": "uri",
                "label": "View detail",
                "uri": url + item.image
            },
            "actions": [
                {
                    "type": "uri",
                    "label": "รายละเอียด",
                    "uri": url + item.image
                }
            ]
        })
    })


    let data = {
        "type": "template",
        "altText": "this is a carousel template",
        "template": {
            "type": "carousel",
            "columns": dataShow,
            "imageAspectRatio": "rectangle",
            "imageSize": "cover"
        }
    }

    return data
}


const FlexResult = async (userID) => {
    let tname = ''
    let vn = ''
    let sql = `SELECT concat(p.pname,p.fname,' ',p.lname)  AS tname,o.vn
    FROM healthcheck_register r
    LEFT JOIN patient p ON p.cid = r.cid
    LEFT JOIN ovst o ON o.hn = p.hn
    WHERE user_id = '${userID}'
    ORDER BY vstdate DESC
    limit 1     `

    const response = await db.query(sql)

    let dataShow = []

    dataShow.push({
        "thumbnailImageUrl": 'https://api-smart-healthcheck.diligentsoftinter.com/result.png',
        "imageBackgroundColor": "#FFFFFF",
        "title": 'รายงานผลการตรวจสุขภาพ',
        "text": response.rows[0].tname,
        "defaultAction": {
            "type": "uri",
            "label": "View detail",
            "uri": 'https://api-smart-healthcheck.diligentsoftinter.com/result.png'
        },
        "actions": [
            {
                "type": "uri",
                "label": "คลิกดูรายละเอียด",
                "uri": `https://sw.srisangworn.go.th/webap/hosxp/reportHCA5.php?vn=${response.rows[0].vn}`
            }
        ]
    })

    let data = {
        "type": "template",
        "altText": "this is a carousel template",
        "template": {
            "type": "carousel",
            "columns": dataShow,
            "imageAspectRatio": "rectangle",
            "imageSize": "cover"
        }
    }

    return data
}


function flexMulti() {
    let data = {
        "type": "template",
        "altText": "this is a carousel template",
        "template": {
            "type": "carousel",
            "columns": [
                {
                    "thumbnailImageUrl": "https://api-queue-ss.diligentsoftinter.com/doctor/1.jpg",
                    "imageBackgroundColor": "#FFFFFF",
                    "title": "แนะนำโรงพยาบาล",
                    "text": "description",
                    "defaultAction": {
                        "type": "uri",
                        "label": "View detail",
                        "uri": "https://api-queue-ss.diligentsoftinter.com/doctor/1.jpg"
                    },
                    "actions": [
                        {
                            "type": "uri",
                            "label": "View detail",
                            "uri": "https://api-queue-ss.diligentsoftinter.com/doctor/1.jpg"
                        }
                    ]
                },
                {
                    "thumbnailImageUrl": "https://sw.srisangworn.go.th/web/wp-content/uploads/2020/01/2018-01-06-800x445.jpg",
                    "imageBackgroundColor": "#FFFFFF",
                    "title": "แนะนำโรงพยาบาล",
                    "text": "description",
                    "defaultAction": {
                        "type": "uri",
                        "label": "View detail",
                        "uri": "https://youtu.be/AxonsKMPPCs"
                    },
                    "actions": [
                        {
                            "type": "uri",
                            "label": "View detail",
                            "uri": "https://youtu.be/AxonsKMPPCs"
                        }
                    ]
                },
            ],
            "imageAspectRatio": "rectangle",
            "imageSize": "cover"
        }
    }

    return data
}
function flexProblem(userId) {
    let data = {
        "type": "template",
        "altText": "this is a carousel template",
        "template": {
            "type": "carousel",
            "columns": [
                {
                    "thumbnailImageUrl": "https://api-queue-ss.diligentsoftinter.com/problem.jpg",
                    "imageBackgroundColor": "#FFFFFF",
                    "title": "แจ้งปัญหาการใช้งาน",
                    "text": "คลินิก",
                    "defaultAction": {
                        "type": "uri",
                        "label": "แจ้งปัญหา",
                        "uri": "https://liff.line.me/1657127015-ARv1Jl32?key=problem"
                    },
                    "actions": [
                        {
                            "type": "uri",
                            "label": "แจ้งปัญหา",
                            "uri": "https://liff.line.me/1657127015-ARv1Jl32?key=problem"
                        }
                    ]
                },
            ],
            "imageAspectRatio": "rectangle",
            "imageSize": "cover"
        }
    }

    return data
}



async function pingT() {
    let host = '110.49.126.23'
    ping.sys.probe(host, function (isAlive) {
        // var msg = isAlive ? 'host ' + host + ' is alive' : 'host ' + host + ' is dead';
        console.log(isAlive);
        if (!isAlive) {
            let data = {
                to: 'U2c04ba314d6649a7f6f2cc3b554b0ad9',
                messages: [
                    // imageAlertOapp(d.vn_reserve)
                    {
                        type: 'text',
                        text: `110.49.126.23  เดี้ยงจร้า💞`
                    }
                    // flexMulti() 
                ]
            }
            request({
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer {${token}}`
                },
                url: 'https://api.line.me/v2/bot/message/push',
                method: 'POST',
                body: data,
                json: true
            }, async function (err, res, body) {
                if (err) console.log('error')
                if (res) { console.log(res) }
                if (body) console.log(body)
            })
        }

    });
}