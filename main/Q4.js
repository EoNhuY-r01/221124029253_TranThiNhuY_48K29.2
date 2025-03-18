d3.csv("data/data_ggsheet.csv").then(data => {
    // Chuyển đổi ngày tạo đơn thành đối tượng Date
    data.forEach(d => {
        d["Thời gian tạo đơn"] = new Date(d["Thời gian tạo đơn"]);
    });

    // Hàm chuyển đổi ngày trong tuần
    const getWeekday = date => {
        const weekdays = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
        return weekdays[date.getDay()];
    };

    // Thêm cột Ngày trong tuần
    data.forEach(d => {
        d["Ngày trong tuần"] = getWeekday(d["Thời gian tạo đơn"]);
    });

    // Tính tổng doanh thu và số lượng bán theo ngày trong tuần
    const revenueByWeekday = d3.rollups(data,
        v => ({
            totalRevenue: d3.sum(v, d => +d["Thành tiền"]),
            totalQuantity: d3.sum(v, d => +d["SL"]),
            totalDays: new Set(v.map(d => d["Thời gian tạo đơn"].toDateString())).size
        }),
        d => d["Ngày trong tuần"]
    );

    // Chuyển dữ liệu thành mảng và tính trung bình
    let transformedData = revenueByWeekday.map(([weekday, values]) => ({
        weekday,
        avgRevenue: values.totalRevenue / values.totalDays,  // Doanh thu TB
        avgQuantity: Math.round(values.totalQuantity / values.totalDays)  // Số lượng TB (làm tròn)
    }));

    // Thứ tự chuẩn của các ngày trong tuần
    const weekdaysOrder = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"];

    // Sắp xếp dữ liệu theo thứ tự chuẩn
    transformedData.sort((a, b) => weekdaysOrder.indexOf(a.weekday) - weekdaysOrder.indexOf(b.weekday));

    // Thiết lập kích thước
    const margin = { top: 50, right: 100, bottom: 50, left: 100 };
    const width = 1200 - margin.left - margin.right;
    const height = 500;

    // Xóa SVG cũ nếu có
    d3.select("svg").selectAll("*").remove();

    // Cập nhật kích thước SVG
    const svg = d3.select("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Tạo thang đo
    const xScale = d3.scaleBand()
        .domain(weekdaysOrder) // Sắp xếp đúng thứ tự
        .range([0, width])
        .padding(0.2);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(transformedData, d => d.avgRevenue) / 1_000_000]) // Đơn vị triệu VND
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
        .attr("x", d => xScale(d.weekday))
        .attr("y", d => yScale(d.avgRevenue / 1_000_000))
        .attr("width", xScale.bandwidth())
        .attr("height", d => height - yScale(d.avgRevenue / 1_000_000))
        .attr("fill", d => colorScale(d.weekday))
        .on("mouseover", function(event, d) {
            tooltip.style("display", "block")
                   .html(`
                       <strong>${d.weekday}</strong><br>
                       Doanh thu TB: ${d3.format(",.0f")(d.avgRevenue)} VND<br>
                       Số lượng bán TB: ${d.avgQuantity}
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
    // **Thêm tiêu đề**
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -30)
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .style("font-weight", "bold")
        .text("Doanh số bán hàng trung bình theo Ngày trong tuần");

    // Thêm nhãn giá trị trên cột
    svg.selectAll(".label")
        .data(transformedData)
        .enter().append("text")
        .attr("class", "label")
        .attr("x", d => xScale(d.weekday) + xScale.bandwidth() / 2)
        .attr("y", d => yScale(d.avgRevenue / 1_000_000) - 5)
        .attr("text-anchor", "middle")
        .text(d => `${d3.format(",.0f")(d.avgRevenue)} VND`);

    // Vẽ trục
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale));

    svg.append("g")
        .call(d3.axisLeft(yScale).ticks(5).tickFormat(d => `${d}M`));

}).catch(error => {
    console.error("Lỗi khi đọc CSV:", error);
});
