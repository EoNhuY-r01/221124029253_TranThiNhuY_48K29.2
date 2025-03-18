// Đọc dữ liệu từ file CSV
d3.csv("data/data_ggsheet.csv").then(data => {
    // Xóa nội dung cũ của SVG để tránh bị chồng lên nhau
    d3.select("#chart").selectAll("*").remove();

    // Kiểm tra nếu dữ liệu bị lỗi
    if (!data || data.length === 0) {
        console.error("Lỗi: Dữ liệu CSV không có dữ liệu.");
        return;
    }

    // Chuyển đổi định dạng ngày và tạo cột "Tháng"
    data.forEach(d => {
        if (d["Thời gian tạo đơn"]) {
            let date = new Date(d["Thời gian tạo đơn"]);
            let month = (date.getMonth() + 1).toString().padStart(2, "0");
            d["Tháng"] = `Tháng ${month}`;
            d["Nhóm hàng"] = `[${d["Mã nhóm hàng"]}] ${d["Tên nhóm hàng"]}`;
        }
    });

    // Tính số đơn hàng duy nhất theo Nhóm hàng & Tháng
    const ordersByCategoryMonth = d3.rollup(data,
        v => new Set(v.map(d => d["Mã đơn hàng"])).size,
        d => d["Nhóm hàng"],
        d => d["Tháng"]
    );

    // Tính tổng số đơn hàng theo từng tháng
    const totalOrdersByMonth = d3.rollup(data,
        v => new Set(v.map(d => d["Mã đơn hàng"])).size,
        d => d["Tháng"]
    );

    // Chuyển dữ liệu thành mảng để vẽ biểu đồ
    let transformedData = [];
    ordersByCategoryMonth.forEach((values, category) => {
        values.forEach((orderCount, month) => {
            transformedData.push({
                category: category,
                month: month,
                probability: (orderCount / totalOrdersByMonth.get(month)) * 100
            });
        });
    });

    // Sắp xếp lại theo tháng
    transformedData.sort((a, b) => d3.ascending(a.month, b.month));

    // Thiết lập kích thước biểu đồ
    const margin = { top: 50, right: 200, bottom: 50, left: 100 };
    const width = 1200 - margin.left - margin.right;
    const height = 500;

    // Tạo hoặc cập nhật SVG
    const svg = d3.select("#chart")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Thang đo trục X (Tháng)
    const xScale = d3.scalePoint()
        .domain([...new Set(transformedData.map(d => d.month))])
        .range([0, width])
        .padding(0.5);

    // Thang đo trục Y (Xác suất %)
    const yScale = d3.scaleLinear()
        .domain([0, 100])
        .range([height, 0]);

    // Nhóm dữ liệu theo category
    const nestedData = d3.group(transformedData, d => d.category);

    // Tạo màu sắc
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    // Vẽ đường line chart
    const line = d3.line()
        .x(d => xScale(d.month))
        .y(d => yScale(d.probability))
        .curve(d3.curveMonotoneX);

    nestedData.forEach((values, category) => {
        svg.append("path")
            .datum(values)
            .attr("fill", "none")
            .attr("stroke", colorScale(category))
            .attr("stroke-width", 2)
            .attr("d", line);

        // Vẽ điểm tròn (circle)
        svg.selectAll(`.dot-${category}`)
            .data(values)
            .enter().append("circle")
            .attr("cx", d => xScale(d.month))
            .attr("cy", d => yScale(d.probability))
            .attr("r", 5)
            .attr("fill", colorScale(category))
            .on("mouseover", function (event, d) {
                tooltip.style("display", "block")
                    .html(`<strong>${d.month}</strong> <br>${d.category}: <strong>${d3.format(".0f")(d.probability)}%</strong>`);
                d3.select(this).attr("r", 7);
            })
            .on("mousemove", function (event) {
                tooltip.style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 20) + "px");
            })
            .on("mouseout", function () {
                tooltip.style("display", "none");
                d3.select(this).attr("r", 5);
            });
    });
    // **Thêm tiêu đề**
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -30)
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .style("font-weight", "bold")
        .text("Xác suất bán hàng của Nhóm hàng theo Tháng");

    // Vẽ trục X
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale));

    // Vẽ trục Y
    svg.append("g")
        .call(d3.axisLeft(yScale).ticks(10).tickFormat(d => `${d}%`));

    // Thêm tooltip nếu chưa có
    let tooltip = d3.select(".tooltip");
    if (tooltip.empty()) {
        tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("background", "#fff")
            .style("border", "1px solid #ccc")
            .style("padding", "10px")
            .style("border-radius", "5px")
            .style("box-shadow", "0px 0px 10px rgba(0,0,0,0.2)")
            .style("display", "none")
            .style("pointer-events", "none");
    }

}).catch(error => {
    console.error("Lỗi khi đọc CSV:", error);
});
