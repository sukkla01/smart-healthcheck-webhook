const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const app = express()
const cors = require('cors')
const db = require('./config')
const moment = require('moment')
moment.locale('th')
const path = require("path")
const port = process.env.PORT || 5004
app.use(cors())
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
app.post('/confirm', async (req, res) => {
    // let userid = req.params.userid
    // let vn = req.params.vn
    // let dataQuery

    let { body } = req
    console.log(body)


    let sql = `SELECT concat(p.pname,p.fname,' ',p.lname)  AS tname,o.vn
    FROM healthcheck_register r
    LEFT JOIN patient p ON p.cid = r.cid
    LEFT JOIN ovst o ON o.hn = p.hn
    WHERE user_id = '${body.userid}'
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
                "uri": `https://sw.srisangworn.go.th/webap/hosxp/reportHCA5p12.php?vn=${response.rows[0].vn}`
            }
        ]
    })

    let data = {
        to: body.userid,
        messages: [
            {
                "type": "template",
                "altText": "this is a carousel template",
                "template": {
                    "type": "carousel",
                    "columns": dataShow,
                    "imageAspectRatio": "rectangle",
                    "imageSize": "cover"
                }
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
        if (err) console.log(err)
        // if (res) {
        //     console.log('success')
        // }
        if (body) console.log(body)
    })


    const resss = await db.query(`UPDATE healthcheck_head  SET type_sent = 1 WHERE uuid ='${body.uuid}'   `)

    res.status(200);
    res.send('success');


})
//reply  oapp
app.post('/oapp', async (req, res) => {
    // let userid = req.params.userid
    // let vn = req.params.vn
    // let dataQuery

    let { body } = req
    console.log(body)


    let sql = `SELECT concat(p.pname,p.fname,' ',p.lname)  AS tname,o.vn
    FROM healthcheck_register r
    LEFT JOIN patient p ON p.cid = r.cid
    LEFT JOIN ovst o ON o.hn = p.hn
    WHERE user_id = '${body.user_id}'
    ORDER BY vstdate DESC
    limit 1     `

    const response = await db.query(sql)

    console.log(moment(body.nextdate).format('YYYY-MM-DD'))

    let dataShow = []

    dataShow.push({
        "thumbnailImageUrl": 'https://api-smart-healthcheck.diligentsoftinter.com/oapp.jpg',
        "imageBackgroundColor": "#FFFFFF",
        "title": 'รายการนัดตรวจสุขภาพ',
        "text": response.rows[0].tname,
        "defaultAction": {
            "type": "uri",
            "label": "View detail",
            "uri": 'https://api-smart-healthcheck.diligentsoftinter.com/oapp.jpg'
        },
        "actions": [
            {
                "type": "uri",
                "label": "คลิกดูใบนัด",
                "uri": `https://smart-healthcheck.diligentsoftinter.com/oapp_print?oapp_id=${body.oapp_id}`
            }
        ]
    })

    let data = {
        to: body.user_id,
        messages: [
            {
                "type": "template",
                "altText": "this is a carousel template",
                "template": {
                    "type": "carousel",
                    "columns": dataShow,
                    "imageAspectRatio": "rectangle",
                    "imageSize": "cover"
                }
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
        if (err) console.log(err)
        // if (res) {
        //     console.log('success')
        // }
        if (body) console.log(body)
    })


    const resss = await db.query(`INSERT INTO healthcheck_send_oapp  values ('${body.hn}','${moment(body.nextdate).format('YYYY-MM-DD')}')   `)

    res.status(200);
    res.send('success');


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





// cron.schedule('*/30 * * * * *', async function () {
//     pingT()
// })
cron.schedule('10 37 21 * * *', function () {
    console.log(new Date().toLocaleString());
});
// cron.schedule('* 36 21 * * *', function(){
//     console.log(new Date().toLocaleString());
// });





app.listen(port)


// ตอบ reply
async function reply(reply_token, type, userID) {
    let headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer {${token}}`
    }
    let reply_tmp
    if (type == 1) {
        reply_tmp = [await FlexResult(userID), otherMessage(), otherRate()]
        // reply_tmp = [Warning()]
    } else if (type == 2) {
        reply_tmp = [imageList1()]
        // reply_tmp = [Warning()]
    } else if (type == 3) {
        reply_tmp = [other()]
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

function otherRate() {

    let data = {
        type: 'text',
        text: `แบบประเมิณความพึงพอใจ https://forms.gle/GLd8riv1kqBd35Vh8 `
    }



    return data
}
function otherMessage() {

    let data = {
        type: 'text',
        text: `**ท่านสามารถดูรายงานฉบับสมบูรณ์ได้ภายหลังการตรวจสุขภาพไปแล้วประมาณ 2 สัปดาห์`
    }



    return data
}


function other() {

    let data = {
        type: 'text',
        text: `ติดต่อสอบถามได้ที่ 055-682030 ถึง 42 ต่อ 2172 หรือ 080-2689978 `
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

    console.log(response)


    if (response.rows.length == 0) {
        let data = {
            type: 'text',
            text: `ยังไม่ได้ลงทะเบียน กรุณาลงทะเบียน หรือติดต่อสอบถามได้ที่ 055-682030 ถึง 42 ต่อ 2172 หรือ 080-2689978  `
        }
        return data
    } else {
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
                    "uri": `https://sw.srisangworn.go.th/webap/hosxp/reportHCA5p12.php?vn=${response.rows[0].vn}`
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


}


function imageList1() {
    let data = {
        "type": "image",
        "originalContentUrl": `https://api-smart-healthcheck.diligentsoftinter.com/program1.jpg`,
        "previewImageUrl": `https://api-smart-healthcheck.diligentsoftinter.com/program1.jpg`
    }
    return data
}