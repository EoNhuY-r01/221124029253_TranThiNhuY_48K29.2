d3.csv("data/data_ggsheet.csv").then(data => {
    // Chuyển đổi định dạng ngày và trích xuất tháng (MM)
    data.forEach(d => {
        let month = (new Date(d["Thời gian tạo đơn"]).getMonth() + 1).toString().padStart(2, "0"); // Định dạng MM
        d["Tháng"] = `Tháng ${month}`; // Chuyển thành chuỗi "Tháng 01", "Tháng 02",...
        d["Thành tiền"] = +d["Thành tiền"]; // Chuyển thành số
    });

    // Tổng doanh thu theo tháng
    const revenueByMonth = d3.rollup(data, 
        v => d3.sum(v, d => d["Thành tiền"]),  
        d => d["Tháng"]
    );

    // Chuyển đổi dữ liệu thành mảng
    let transformedData = Array.from(revenueByMonth, ([month, revenue]) => ({ month, revenue }));

    // Sắp xếp theo thứ tự tháng
    transformedData.sort((a, b) => d3.ascending(a.month, b.month));

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
        .domain(transformedData.map(d => d.month)) // "Tháng 01", "Tháng 02",...
        .range([0, width])
        .padding(0.2);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(transformedData, d => d.revenue) / 1_000_000]) // Đơn vị triệu VND
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
        .attr("x", d => xScale(d.month))
        .attr("y", d => yScale(d.revenue / 1_000_000))
        .attr("width", xScale.bandwidth())
        .attr("height", d => height - yScale(d.revenue / 1_000_000))
        .attr("fill", d => colorScale(d.month))
        .on("mouseover", function(event, d) {
            tooltip.style("display", "block")
                   .html(` 
                       <strong>${d.month}</strong><br>
                       Doanh số bán: ${d3.format(",")(d.revenue)} VND
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
        .text("Doanh số bán hàng theo Tháng");

    // Thêm nhãn giá trị trên cột
    svg.selectAll(".label")
        .data(transformedData)
        .enter().append("text")
        .attr("class", "label")
        .attr("x", d => xScale(d.month) + xScale.bandwidth() / 2)
        .attr("y", d => yScale(d.revenue / 1_000_000) - 5)
        .attr("text-anchor", "middle")
        .text(d => `${d3.format(",.0f")(d.revenue / 1_000_000)} triệu VND`);

    // Vẽ trục
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale));

    svg.append("g")
        .call(d3.axisLeft(yScale).ticks(5).tickFormat(d => `${d}M`));

}).catch(error => {
    console.error("Lỗi khi đọc CSV:", error);
});
