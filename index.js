//cd OneDrive/Documents/travail/Polytech/S7/DATA732/TP3

const express = require('express')
const fs = require('fs')
const d3 = require('d3')
const { JSDOM } = require('jsdom')
const topojson = require('topojson')

const app = express()
const port = 3000

let svgData = ""

margin = ({top: 30, right: 0, bottom: 30, left: 30})
height = 500
width = 750
color = "steelblue"


app.get('/', (req, res) => {
    res.send(svgData)
})


fs.readFile("TP3.csv", 'utf8', function (err, csvFile) {
    fs.readFile("states.json", 'utf8', function (err2, jsonFile) {
        if (err || err2) {
            return (err) ? console.log(err) : console.log(err2)
        }
        
        let dsvParser = d3.dsvFormat(';')
        let csvData = dsvParser.parse(csvFile, d3.autoType)

        let jsonData = JSON.parse(jsonFile)


        const dom = new JSDOM(`<!DOCTYPE html><body></body>`);
        let body = d3.select(dom.window.document.querySelector("body"))
        
        let csvDataMap1 = getMap1Data(csvData)
        let csvDataMap2 = getMap2Data(csvData)
        let csvDataMap3 = getMap3Data(csvData)

        svgData = getMap1(csvDataMap1, jsonData, body)
        
        /*
        let csvDataMap2Age = getMap2Age(csvDataMap2)
        csvDataMap2Age.sort(function(first, second) {
            return first.age - second.age;
        });
        svgData = getMap2(csvDataMap2Age.slice(2), body)
        */
       
        /*
       let csvDataMap3Race = getMap3Race(csvDataMap3)
       console.log(csvDataMap3Race)
       svgData = getMap3(csvDataMap3Race, body)
        */

        app.listen(port, () => {

            console.log(`Example app listening at http://localhost:${port}`)
        })
    })
})


function getMap1(data, us, body) {
    let radius = d3.scaleSqrt([0, d3.max(data, d => d.victims)], [0, 40])

    let projection = d3.geoAlbersUsa().scale(1300).translate([487.5, 305])

    let svg = body.append('svg')
        .attr("viewBox", [0, 0, 975, 610])

    svg.append("path")
        .datum(topojson.feature(us, us.objects.nation))
        .attr("fill", "#ddd")
        .attr("d", d3.geoPath())

    svg.append("path")
        .datum(topojson.mesh(us, us.objects.states, (a, b) => a !== b))
        .attr("fill", "none")
        .attr("stroke", "white")
        .attr("stroke-linejoin", "round")
        .attr("d", d3.geoPath())

    svg.append("g")
            .attr("fill", "brown")
            .attr("fill-opacity", 0.5)
            .attr("stroke", "#fff")
            .attr("stroke-width", 0.5)
        .selectAll("circle")
        .data(data)
        .join("circle")
            .attr("transform", d => `translate(${projection([d.longitude, d.latitude])})`)
            .attr("r", d => radius(d.victims))

    return body.html()
}


function getMap2(data, body) {
    let svg = body.append('svg')
        .attr("viewBox", [0, 0, 975, 610])

    x = d3.scaleBand()
        .domain(d3.range(data.length))
        .range([margin.left, width - margin.right])
        .padding(0.1)

    y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.fatalities)]).nice()
        .range([height - margin.bottom, margin.top])

    xAxis = g => g
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).tickFormat(i => data[i].age).tickSizeOuter(0))

    yAxis = g => g
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(null, data.format))
        .call(g => g.select(".domain").remove())
        .call(g => g.append("text")
            .attr("x", -margin.left)
            .attr("y", 10)
            .attr("fill", "currentColor")
            .attr("text-anchor", "start")
            .text(data.age))

    svg.append("g")
            .attr("fill", color)
        .selectAll("rect")
        .data(data)
        .join("rect")
        .attr("x", (d, i) => x(i))
        .attr("y", d => y(d.fatalities))
        .attr("height", d => y(0) - y(d.fatalities))
        .attr("width", x.bandwidth());

    svg.append("g")
        .call(xAxis);

    svg.append("g")
        .call(yAxis);

    return body.html()
}


function getMap3(data, body) {
    let svg = body.append('svg')
        .attr("viewBox", [-500, -250, 975, 610])

    arc = d3.arc()
        .innerRadius(0)
        .outerRadius(Math.min(width, height) / 2 - 1)

    pie = d3.pie()
        .sort(null)
        .value(d => d.nb)

    const arcs = pie(data);

    color = d3.scaleOrdinal()
        .domain(data.map(d => d.race))
        .range(d3.quantize(t => d3.interpolateSpectral(t * 0.8 + 0.1), data.length).reverse())

    svg.append("g")
      .attr("stroke", "white")
    .selectAll("path")
    .data(arcs)
    .join("path")
      .attr("fill", d => color(d.data.race))
      .attr("d", arc)
    .append("title")
      .text(d => `${d.data.race}: ${d.data.nb.toLocaleString()}`);

  svg.append("g")
      .attr("font-family", "sans-serif")
      .attr("font-size", 12)
      .attr("text-anchor", "middle")
    .selectAll("text")
    .data(arcs)
    return body.html()
}



function getMap1Data(csvData) {
    return csvData.map(d => { return { victims: d.total_victims, latitude: d.latitude, longitude: d.longitude } })
}

function getMap2Data(csvData) {
    return csvData.map(d => { return { fatalities: d.fatalities, age: d.age_of_shooter } })
}

function getMap3Data(csvData) {
    return csvData.map(d => { return { race: d.race, gender: d.gender } })
}

function getMap2Age(csvDataMap2) {
    var arr = [];
    for (ind in csvDataMap2) {
        var etat = 0;
        for (ind2 in arr) {
            try {
                if (arr[ind2]["age"] == csvDataMap2[ind]["age"]) {
                    arr[ind2]["fatalities"] += csvDataMap2[ind]["fatalities"];
                    etat = 1;
                }
            }
            catch(error) {}
        }
        
        if (etat == 0) {
                arr[arr.length] = csvDataMap2[ind];
            }
        }
    return arr;
}

function getMap3Race(csvDataMap3) {
    var arr = [];
    for (ind in csvDataMap3) {
        var etat = 0;
        for (ind2 in arr) {
            try {
                if (arr[ind2]["race"] == csvDataMap3[ind]["race"]) {
                    arr[ind2]["nb"] += 1;
                    etat = 1;
                }
            }
            catch(error) {}
        }
        
        if (etat == 0) {
                arr[arr.length] = { race: csvDataMap3[ind]["race"], nb: 1};
            }
    }

    var arr2 = [];
    for (ind in arr) {
        if ((arr[ind]["race"] == 'White') || (arr[ind]["race"] == 'Black') || (arr[ind]["race"] == 'Latino') || (arr[ind]["race"] == 'Asian') || (arr[ind]["race"] == 'Other') || (arr[ind]["race"] == 'Native American')) {
            arr2[arr2.length] = arr[ind];
        }
        if ((arr[ind]["race"] == '-') || (arr[ind]["race"] == 'unclear')){}
        if (arr[ind]["race"] == 'White '){
            arr2[1]["nb"] += arr[ind]["nb"];
        }
        if (arr[ind]["race"] == 'white'){
            arr2[1]["nb"] += arr[ind]["nb"];
        }
        if (arr[ind]["race"] == 'black'){
            arr2[0]["nb"] += arr[ind]["nb"];
        }
        
    }
    return arr2;
}
