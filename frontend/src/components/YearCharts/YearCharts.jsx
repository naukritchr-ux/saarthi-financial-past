import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";


import "./YearCharts.css";


function YearCharts({data}){


return (

<div className="year-chart-container">


<div className="chart-box">

<h3>
Billing Growth
</h3>


<ResponsiveContainer width="100%" height={300}>

<BarChart data={data}>


<XAxis dataKey="year"/>

<YAxis/>

<Tooltip/>

<Bar
dataKey="billing"
fill="#1B2A4A"
/>


</BarChart>

</ResponsiveContainer>


</div>





<div className="chart-box">


<h3>
Billing vs Received
</h3>


<ResponsiveContainer width="100%" height={300}>


<BarChart data={data}>


<XAxis dataKey="year"/>

<YAxis/>

<Tooltip/>

<Legend/>


<Bar
dataKey="billing"
fill="#B78A34"
/>


<Bar
dataKey="received"
fill="#26734D"
/>


</BarChart>


</ResponsiveContainer>


</div>






<div className="chart-box">


<h3>
Profit Growth
</h3>


<ResponsiveContainer width="100%" height={300}>


<LineChart data={data}>


<XAxis dataKey="year"/>

<YAxis/>

<Tooltip/>


<Line

type="monotone"

dataKey="profit"

stroke="#26734D"

strokeWidth={3}

/>


</LineChart>


</ResponsiveContainer>


</div>






<div className="chart-box">


<h3>
Placement Growth
</h3>


<ResponsiveContainer width="100%" height={300}>


<LineChart data={data}>


<XAxis dataKey="year"/>

<YAxis/>

<Tooltip/>


<Line

type="monotone"

dataKey="placements"

stroke="#B78A34"

strokeWidth={3}

/>


</LineChart>


</ResponsiveContainer>


</div>



</div>


);


}


export default YearCharts;