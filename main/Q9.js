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

    data.forEach(d => {
        d["Nhóm hàng"] = `[${d["Mã nhóm hàng"]}] ${d["Tên nhóm hàng"]}`;
        d["Mặt hàng"] = `[${d["Mã mặt hàng"]}] ${d["Tên mặt hàng"]}`;
    });

    const ordersByCategory = d3.rollup(data,
        v => new Set(v.map(d => d["Mã đơn hàng"])).size,
        d => d["Nhóm hàng"]
    );

    const ordersByProduct = d3.rollup(data,
        v => new Set(v.map(d => d["Mã đơn hàng"])).size,
        d => d["Nhóm hàng"],
        d => d["Mặt hàng"]
    );

    let transformedData = [];
    ordersByProduct.forEach((products, category) => {
        products.forEach((orderCount, product) => {
            transformedData.push({
                category: category,
                product: product,
                probability: (orderCount / ordersByCategory.get(category)) * 100
            });
        });
    });

    transformedData = transformedData.filter(d => d.product && !isNaN(d.probability));
    transformedData.sort((a, b) => d3.descending(a.probability, b.probability));
    const nestedData = d3.group(transformedData, d => d.category);

    const width = 350, barHeight = 25, margin = { top: 20, right: 50, bottom: 20, left: 150 };

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
        const height = Math.max(products.length * barHeight + margin.top + margin.bottom, 100);

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
            .attr("height", height)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const xScale = d3.scaleLinear().domain([0, 100]).range([0, width]);
        const yScale = d3.scaleBand().domain(products.map(d => d.product)).range([0, height - margin.top - margin.bottom]).padding(0.1);
        const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

        svg.selectAll("rect")
            .data(products)
            .enter().append("rect")
            .attr("x", 0)
            .attr("y", d => yScale(d.product))
            .attr("width", d => xScale(d.probability))
            .attr("height", yScale.bandwidth())
            .attr("fill", d => colorScale(d.product))
            .on("mouseover", function (event, d) {
                tooltip.style("display", "block")
                    .html(`<strong>${d.product}</strong><br>Xác suất: ${d3.format(".1f")(d.probability)}%`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 10) + "px");
            })
            .on("mousemove", function (event) {
                tooltip.style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 10) + "px");
            })
            .on("mouseout", function () {
                tooltip.style("display", "none");
            });
    // **Thêm tiêu đề**
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -30)
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .style("font-weight", "bold")
        .text("Xac suất bán hàng của Mặt hàng theo Nhóm hàng");

        svg.selectAll(".label")
            .data(products)
            .enter().append("text")
            .attr("x", d => xScale(d.probability) + 5)
            .attr("y", d => yScale(d.product) + yScale.bandwidth() / 2)
            .attr("alignment-baseline", "middle")
            .attr("fill", "black")
            .text(d => `${d3.format(".1f")(d.probability)}%`);

        svg.append("g")
            .call(d3.axisLeft(yScale).tickSize(0).tickPadding(5));
    });
}).catch(error => {
    console.error("Lỗi khi đọc CSV:", error);
});
