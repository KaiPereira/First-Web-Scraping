const { JSDOM } = require("jsdom")
const axios = require("axios")
const { appendFileSync } = require("fs")


function toHTML(html) {
    const textToHTML = new JSDOM(html)
    return textToHTML.window.document
}


async function scrape() {

    const res = await axios.get("https://www.sd61.bc.ca/schools/school-map/")
    const data = res.data

    const links = toHTML(data).getElementsByClassName("page-link")
    const linksArray = Array.from(links)

    let schoolInfo = linksArray.map(async (link) => {
        const nextSibling = link.nextElementSibling

        const res2 = await axios.get(`https://www.sd61.bc.ca/${link.href}`)
        const data2 = res2.data
        let schoolUrl = toHTML(data2).getElementsByClassName("website").item(0)

        if (schoolUrl)
        return Promise.resolve(axios.get(schoolUrl.children.item(0).href)
            .then(data => {
                const schoolAboutUsURL = toHTML(data.data).getElementsByClassName("page_item").item(0).children.item(0).href
                const schoolAboutText = axios.get(!schoolAboutUsURL.includes("https") ? `${schoolUrl.children.item(0).href}${schoolAboutUsURL}` : schoolAboutUsURL)
                    .then(data => {
                        const aboutUs = toHTML(data.data)
                        return aboutUs.querySelector("article").textContent
                        // return "HELLO WORLD!!!"
                    })
                    .catch(err => console.log("ERROR"))

                return Promise.resolve(schoolAboutText)
            }))

        // return {
        //     link: link.href,
        //     title: nextSibling.innerHTML
        // }
    })



    Promise.all(schoolInfo).then(data => {
        console.log(data.join(" ").trim())
        appendFileSync("contents.txt", data.join(" ").trim().replace(/\s\s+/g, ' '))
    })

}


scrape()