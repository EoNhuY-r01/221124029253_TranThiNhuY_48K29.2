d3.csv("data/data_ggsheet.csv").then(data => {
    // Tính tổng mức chi tiêu của từng khách hàng
    let customerSpending = new Map();

    data.forEach(d => {
        let customerID = d["Mã khách hàng"];
        let amount = +d["Thành tiền"];

        if (!customerSpending.has(customerID)) {
            customerSpending.set(customerID, 0);
        }
        customerSpending.set(customerID, customerSpending.get(customerID) + amount);
    });

    // Chuyển thành mảng
    let spendingData = Array.from(customerSpending.values());

    // Xác định bin width (50,000 VND)
    let binWidth = 50000;
    let maxSpending = d3.max(spendingData);
    let bins = d3.range(0, maxSpending + binWidth, binWidth);

    // Tính phân phối mức chi tiêu
    let spendingDistribution = d3.rollup(
        spendingData,
        v => v.length,  // Đếm số khách hàng trong từng bin
        d => Math.floor(d / binWidth) * binWidth  // Gom nhóm theo bin
    );

    // Chuyển thành mảng để vẽ
    let transformedData = Array.from(spendingDistribution, ([range, customers]) => ({
        range,
        customers
    }));

    // Sắp xếp theo mức chi tiêu tăng dần
    transformedData.sort((a, b) => a.range - b.range);

    // Kích thước biểu đồ
    const margin = { top: 70, right: 50, bottom: 50, left: 50 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Tạo SVG
    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // **Thêm tiêu đề**
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -30)
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .style("font-weight", "bold")
        .text("Phân phối Mức chi tiêu");

    // Thang đo
    const xScale = d3.scaleBand()
        .domain(transformedData.map(d => d.range))
        .range([0, width])
        .padding(0.2);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(transformedData, d => d.customers)])
        .range([height, 0]);

    // Tooltip
    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background", "#fff")
        .style("border", "1px solid #ccc")
        .style("padding", "10px")
        .style("border-radius", "5px")
        .style("box-shadow", "0px 0px 10px rgba(0,0,0,0.2)")
        .style("display", "none")
        .style("pointer-events", "none");

    // Vẽ cột
    svg.selectAll(".bar")
        .data(transformedData)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => xScale(d.range))
        .attr("y", d => yScale(d.customers))
        .attr("width", xScale.bandwidth())
        .attr("height", d => height - yScale(d.customers))
        .attr("fill", "#17a2b8")
        .on("mouseover", function(event, d) {
            tooltip.style("display", "block")
                   .html(`
                       <strong>Mức Chi Tiêu:</strong> ${d3.format(",")(d.range)} - ${d3.format(",")(d.range + binWidth)} VND <br>
                       <strong>Số lượng KH:</strong> ${d3.format(",")(d.customers)}
                   `);
            d3.select(this).style("opacity", 0.7);
        })
        .on("mousemove", function(event) {
            tooltip.style("left", (event.pageX + 10) + "px")
                   .style("top", (event.pageY - 20) + "px");
        })
        .on("mouseout", function() {
            tooltip.style("display", "none");
            d3.select(this).style("opacity", 1);
        });

    // Trục X
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale).tickFormat(""));

    // Trục Y
    svg.append("g")
        .call(d3.axisLeft(yScale));

}).catch(error => {
    console.error("Lỗi khi đọc CSV:", error);
});
