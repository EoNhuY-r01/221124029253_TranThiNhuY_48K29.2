d3.csv("data/data_ggsheet.csv").then(data => {
    // Tổng doanh thu theo nhóm hàng
    const revenueByCategory = d3.rollup(data, 
        v => d3.sum(v, d => +d["Thành tiền"]),  
        d => `[${d["Mã nhóm hàng"]}] ${d["Tên nhóm hàng"]}`  
    );

    // Chuyển dữ liệu thành mảng để vẽ
    let transformedData = Array.from(revenueByCategory, ([category, revenue]) => ({ category, revenue }));

    // Sắp xếp theo doanh thu giảm dần
    transformedData.sort((a, b) => b.revenue - a.revenue);

    // Thiết lập kích thước
    const margin = { top: 50, right: 200, bottom: 50, left: 350 };
    const width = 1200 - margin.left - margin.right;
    const height = transformedData.length * 40;

    // Cập nhật kích thước SVG
    const svg = d3.select("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Tạo thang đo
    const xScale = d3.scaleLinear()
        .domain([0, d3.max(transformedData, d => d.revenue) / 1_000_000]) // Đơn vị triệu VND
        .range([0, width]);

    const yScale = d3.scaleBand()
        .domain(transformedData.map(d => d.category))
        .range([0, height])
        .padding(0.2);

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
        .attr("y", d => yScale(d.category))
        .attr("x", 0)
        .attr("height", yScale.bandwidth())
        .attr("width", d => xScale(d.revenue / 1_000_000)) // Đơn vị triệu VND
        .attr("fill", d => colorScale(d.category))
        .on("mouseover", function(event, d) {
            tooltip.style("display", "block")
                   .html(`
                       <strong>Nhóm hàng:</strong> ${d.category} <br>
                       <strong>Doanh số bán:</strong> ${d3.format(",")(d.revenue)} VND
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
        .text("Doanh số bán hàng theo Nhóm hàng");

    // Thêm nhãn giá trị trên cột
    svg.selectAll(".label")
        .data(transformedData)
        .enter().append("text")
        .attr("class", "label")
        .attr("x", d => xScale(d.revenue / 1_000_000) + 5)
        .attr("y", d => yScale(d.category) + yScale.bandwidth() / 2)
        .attr("dy", ".35em")
        .text(d => `${d3.format(",.0f")(d.revenue / 1_000_000)} triệu VND`);

    // Vẽ trục
    svg.append("g")
        .call(d3.axisLeft(yScale));

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale).ticks(5).tickFormat(d => `${d}M`)); // Trục X hiển thị M

}).catch(error => {
    console.error("Lỗi khi đọc CSV:", error);
});
