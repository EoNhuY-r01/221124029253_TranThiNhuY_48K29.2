d3.csv("data/data_ggsheet.csv").then(data => {
    // Tạo Map để lưu số lượng đơn hàng duy nhất của từng khách hàng
    let customerOrders = new Map();

    data.forEach(d => {
        let customerID = d["Mã khách hàng"];
        let orderID = d["Mã đơn hàng"];

        if (!customerOrders.has(customerID)) {
            customerOrders.set(customerID, new Set());
        }
        customerOrders.get(customerID).add(orderID);
    });

    // Tính số lượt mua hàng (COUNTD số đơn hàng của từng khách hàng)
    let purchaseCounts = Array.from(customerOrders.values(), orders => orders.size);

    // Tính phân phối số lượt mua hàng
    let purchaseDistribution = d3.rollup(
        purchaseCounts,
        v => v.length,  // Đếm số khách hàng có cùng số lượt mua
        d => d // Nhóm theo số lượt mua
    );

    // Chuyển thành mảng để vẽ
    let transformedData = Array.from(purchaseDistribution, ([count, customers]) => ({ count, customers }));

    // Sắp xếp theo số lượt mua hàng tăng dần
    transformedData.sort((a, b) => a.count - b.count);

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
        .text("Phân phối lượt mua hàng");

    // Thang đo
    const xScale = d3.scaleBand()
        .domain(transformedData.map(d => d.count))
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
        .attr("x", d => xScale(d.count))
        .attr("y", d => yScale(d.customers))
        .attr("width", xScale.bandwidth())
        .attr("height", d => height - yScale(d.customers))
        .attr("fill", "#5a9ecf")
        .on("mouseover", function(event, d) {
            tooltip.style("display", "block")
                   .html(`
                       <strong>Số lượt mua hàng:</strong> ${d.count} <br>
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
        .style("font-size", "10px")
        .call(d3.axisBottom(xScale));

    // Trục Y
    svg.append("g")
        .call(d3.axisLeft(yScale));

}).catch(error => {
    console.error("Lỗi khi đọc CSV:", error);
});
