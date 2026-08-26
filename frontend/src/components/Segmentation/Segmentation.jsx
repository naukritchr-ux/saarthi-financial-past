import {
  Tabs,
  Tab,
  Card,
  CardContent
} from "@mui/material";

import { useState } from "react";

import "./Segmentation.css";


function Segmentation(){


const [selected,setSelected]=useState(0);



const segments=[

"BD Member",

"Team Leader",

"Franchise",

"Industry",

"Client Status",

"City",

"Position"

];



return(

<Card className="segmentation-card">


<CardContent>


<h3>
View Performance By
</h3>



<Tabs

value={selected}

onChange={(e,value)=>setSelected(value)}

variant="scrollable"

scrollButtons="auto"

>


{
segments.map((segment,index)=>(


<Tab

key={segment}

label={segment}

/>


))

}


</Tabs>



<div className="segment-result">


Selected:

<strong>
 {segments[selected]}
</strong>


</div>



</CardContent>


</Card>


)


}


export default Segmentation;