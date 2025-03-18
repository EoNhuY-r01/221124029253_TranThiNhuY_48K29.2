d3.csv("data/data_ggsheet.csv").then(data => {
    d3.select(".chart-container").remove();
    d3.select(".tooltip").remove();
    
    const container = d3.select("body").append("div")
        .attr("class", "chart-container")
        .style("display", "grid")
        .style("grid-template-columns", "repeat(3, 1fr)")
        .style("gap", "20px")
        .style("max-width", "1200px")
        .style("margin", "auto");

    if (!data || data.length === 0) {
        console.error("Lỗi: Dữ liệu CSV rỗng hoặc không đọc được.");
        return;
    }

    data.forEach(d => {
        if (!d["Mã nhóm hàng"] || !d["Tên nhóm hàng"] || !d["Mã mặt hàng"] || !d["Tên mặt hàng"] || !d["Mã đơn hàng"] || !d["Thời gian tạo đơn"]) {
            console.warn("Dữ liệu không đầy đủ:", d);
            return;
        }
        d["Nhóm hàng"] = `[${d["Mã nhóm hàng"]}] ${d["Tên nhóm hàng"]}`;
        d["Mặt hàng"] = `[${d["Mã mặt hàng"]}] ${d["Tên mặt hàng"]}`;
        d["Tháng"] = d["Thời gian tạo đơn"].substring(5, 7); // Trích xuất tháng từ ngày
    });

    const ordersByCategoryMonth = d3.rollup(data,
        v => new Set(v.map(d => d["Mã đơn hàng"])).size,
        d => d["Nhóm hàng"],
        d => d["Tháng"]
    );

    const ordersByProductMonth = d3.rollup(data,
        v => new Set(v.map(d => d["Mã đơn hàng"])).size,
        d => d["Nhóm hàng"],
        d => d["Mặt hàng"],
        d => d["Tháng"]
    );

    let transformedData = [];
    ordersByProductMonth.forEach((products, category) => {
        products.forEach((months, product) => {
            months.forEach((orderCount, month) => {
                transformedData.push({
                    category: category,
                    product: product,
                    month: month,
                    probability: (orderCount / ordersByCategoryMonth.get(category).get(month)) * 100
                });
            });
        });
    });

    transformedData = transformedData.filter(d => d.product && !isNaN(d.probability));
    transformedData.sort((a, b) => d3.ascending(a.month, b.month));
    const nestedData = d3.group(transformedData, d => d.category);

    const width = 350, height = 250, margin = { top: 20, right: 50, bottom: 50, left: 150 };

    let tooltip = d3.select(".tooltip");
    if (tooltip.empty()) {
        tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("background", "white")
            .style("padding", "5px")
            .style("border", "1px solid #ddd")
            .style("border-radius", "5px")
            .style("box-shadow", "0px 2px 5px rgba(0,0,0,0.1)")
            .style("display", "none");
    }

    nestedData.forEach((products, category) => {
        const chartDiv = container.append("div").attr("class", "chart-box")
            .style("border", "1px solid #ddd")
            .style("padding", "10px")
            .style("border-radius", "8px")
            .style("box-shadow", "0px 2px 5px rgba(0,0,0,0.1)");

        chartDiv.append("h3")
            .text(category)
            .style("color", "#00AEEF")
            .style("font-weight", "bold")
            .style("text-align", "center");

        const svg = chartDiv.append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const xScale = d3.scaleLinear().domain([1, 12]).range([0, width]);
        const yScale = d3.scaleLinear().domain([0, 100]).range([height, 0]);
        const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

        const line = d3.line()
            .x(d => xScale(+d.month))
            .y(d => yScale(d.probability));

        const productGroups = d3.group(products, d => d.product);

        productGroups.forEach((values, product) => {
            svg.append("path")
                .datum(values)
                .attr("fill", "none")
                .attr("stroke", colorScale(product))
                .attr("stroke-width", 2)
                .attr("d", line);

            svg.selectAll(".dot")
                .data(values)
                .enter().append("circle")
                .attr("class", "dot")
                .attr("cx", d => xScale(+d.month))
                .attr("cy", d => yScale(d.probability))
                .attr("r", 4)
                .attr("fill", colorScale(product))
                .on("mouseover", function(event, d) {
                    tooltip.style("display", "block")
                        .html(`<strong>${d.product}</strong><br>Tháng: ${d.month}<br>Xác suất: ${d3.format(".1f")(d.probability)}%`)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 10) + "px");
                })
                .on("mouseout", function() {
                    tooltip.style("display", "none");
                });
        });

        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(xScale).ticks(12).tickFormat(d3.format("02")));

        svg.append("g")
            .call(d3.axisLeft(yScale));
    // **Thêm tiêu đề**
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -30)
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .style("font-weight", "bold")
        .text("Xac suất bán hàng của Mặt hàng theo Nhóm hàng theo Tháng");

    });

}).catch(error => {
    console.error("Lỗi khi đọc CSV:", error);
});
