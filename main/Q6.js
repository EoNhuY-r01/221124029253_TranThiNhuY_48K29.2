d3.csv("data/data_ggsheet.csv").then(data => {
    // Chuyển đổi cột "Thời gian tạo đơn" thành dạng Date
    data.forEach(d => {
        d["Thời gian tạo đơn"] = new Date(d["Thời gian tạo đơn"]);
        d["Giờ"] = d["Thời gian tạo đơn"].getHours();
        d["Ngày"] = d["Thời gian tạo đơn"].toDateString();
    });

    // Nhóm theo khung giờ & tính tổng doanh thu, số lượng đơn
    const revenueByHour = d3.rollups(data,
        v => ({
            totalRevenue: d3.sum(v, d => +d["Thành tiền"]),
            totalOrders: v.length,
            totalDays: new Set(v.map(d => d["Ngày"])).size
        }),
        d => d["Giờ"]
    );

    // Chuyển dữ liệu thành mảng & tính doanh thu trung bình
    let transformedData = revenueByHour.map(([hour, values]) => ({
        hour,
        avgRevenue: values.totalRevenue / values.totalDays // Doanh thu trung bình
    }));

    // Sắp xếp theo giờ
    transformedData.sort((a, b) => a.hour - b.hour);

    // Tạo nhãn giờ theo định dạng "hh:00 - hh:59"
    transformedData.forEach(d => {
        let start = d.hour.toString().padStart(2, "0") + ":00";
        let end = d.hour.toString().padStart(2, "0") + ":59";
        d.timeRange = `${start} - ${end}`;
    });

    // Kích thước biểu đồ
    const margin = { top: 50, right: 50, bottom: 50, left: 80 };
    const width = 1200 - margin.left - margin.right;
    const height = 500;

    // Xóa biểu đồ cũ nếu có
    d3.select("svg").selectAll("*").remove();

    // Cập nhật kích thước SVG
    const svg = d3.select("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Tạo thang đo
    const xScale = d3.scaleBand()
        .domain(transformedData.map(d => d.timeRange))
        .range([0, width])
        .padding(0.2);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(transformedData, d => d.avgRevenue) / 1_000]) // Đơn vị nghìn VND
        .nice()
        .range([height, 0]);

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

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
        .attr("x", d => xScale(d.timeRange))
        .attr("y", d => yScale(d.avgRevenue / 1_000))
        .attr("width", xScale.bandwidth())
        .attr("height", d => height - yScale(d.avgRevenue / 1_000))
        .attr("fill", d => colorScale(d.hour))
        .on("mouseover", function (event, d) {
            tooltip.style("display", "block")
                .html(`
                    <strong>Khung giờ: ${d.timeRange}</strong><br>
                    Doanh số TB: ${d3.format(",.0f")(d.avgRevenue)} VND
                `);
            d3.select(this).style("opacity", 0.7);
        })
        .on("mousemove", function (event) {
            tooltip.style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px");
        })
        .on("mouseout", function () {
            tooltip.style("display", "none");
            d3.select(this).style("opacity", 1);
        });

    // Thêm nhãn giá trị trên cột
    svg.selectAll(".label")
        .data(transformedData)
        .enter().append("text")
        .attr("class", "label")
        .attr("x", d => xScale(d.timeRange) + xScale.bandwidth() / 2)
        .attr("y", d => yScale(d.avgRevenue / 1_000) - 5)
        .attr("text-anchor", "middle")
        .text(d => `${d3.format(",.1f")(d.avgRevenue / 1_000)}K`);
    // **Thêm tiêu đề**
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -30)
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .style("font-weight", "bold")
        .text("Doanh số bán hàng trung bình theo Khung giờ");

    // Vẽ trục
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale).tickSize(0))
        .selectAll("text")
        .style("text-anchor", "middle") // Canh giữa
        .style("font-size", "10px")
        .attr("transform", "rotate(0)");

    svg.append("g")
        .call(d3.axisLeft(yScale).ticks(5).tickFormat(d => `${d}K`));

}).catch(error => {
    console.error("Lỗi khi đọc CSV:", error);
});
