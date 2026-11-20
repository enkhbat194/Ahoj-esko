import React, { useRef, useState } from 'react';

interface Point { x:number; y:number }
type Stroke = Point[];

export const LetterTracePad: React.FC<{
  letter: string;
  onAttemptChange: (attempted:boolean) => void;
}> = ({letter,onAttemptChange}) => {
  const [strokes,setStrokes]=useState<Stroke[]>([]);
  const drawing=useRef(false);
  const previousPoint=useRef<Point|null>(null);
  const distanceRef=useRef(0);
  const ref=useRef<SVGSVGElement|null>(null);
  const point=(e:React.PointerEvent<SVGSVGElement>):Point=>{
    const bounds=e.currentTarget.getBoundingClientRect();
    return {
      x:Math.max(0,Math.min(320,(e.clientX-bounds.left)*320/Math.max(1,bounds.width))),
      y:Math.max(0,Math.min(320,(e.clientY-bounds.top)*320/Math.max(1,bounds.height))),
    };
  };
  const down=(e:React.PointerEvent<SVGSVGElement>)=>{
    e.preventDefault();
    drawing.current=true;
    const first=point(e);
    previousPoint.current=first;
    distanceRef.current=0;
    try{e.currentTarget.setPointerCapture(e.pointerId);}catch{}
    setStrokes(current=>[...current.slice(-15),[first]]);
  };
  const move=(e:React.PointerEvent<SVGSVGElement>)=>{
    if(!drawing.current)return;
    e.preventDefault();
    const p=point(e);
    if(previousPoint.current){
      distanceRef.current += Math.hypot(p.x-previousPoint.current.x,p.y-previousPoint.current.y);
      if(distanceRef.current>=35)onAttemptChange(true);
    }
    previousPoint.current=p;
    setStrokes(current=>{
      const updated=[...current];
      const last=updated.pop()??[];
      updated.push([...last.slice(-600),p]);
      return updated;
    });
  };
  const stop=()=>{
    drawing.current=false;
    previousPoint.current=null;
    // This is evidence of a physical tracing attempt, NOT of handwriting accuracy.
  };
  const clear=()=>{
    setStrokes([]);
    distanceRef.current=0;
    previousPoint.current=null;
    onAttemptChange(false);
  };
  const attempts=strokes.some(points=>{
    if(points.length<5)return false;
    const first=points[0],last=points[points.length-1];
    return Math.hypot(first.x-last.x,first.y-last.y)>25 ||
      points.reduce((sum,p,i)=>i?sum+Math.hypot(p.x-points[i-1].x,p.y-points[i-1].y):0,0)>35;
  });
  return <div className="alphabet-trace-box">
    <svg ref={ref} viewBox="0 0 320 320" className="alphabet-trace-svg"
      role="img" aria-label={`${letter} үсгийг хуруугаар дагуулж бичих талбар`}
      onPointerDown={down} onPointerMove={move} onPointerUp={stop}
      onPointerCancel={stop} onLostPointerCapture={stop}
      style={{touchAction:'none',userSelect:'none'}}>
      <rect x="2" y="2" width="316" height="316" rx="20" fill="#09191C" stroke="#B29A67" strokeOpacity=".48" strokeWidth="2"/>
      {[80,160,240].map(y=><line key={y} x1="20" x2="300" y1={y} y2={y} stroke="#739A98" strokeOpacity=".29" strokeDasharray="7 7"/>)}
      {[80,160,240].map(x=><line key={x} x1={x} x2={x} y1="20" y2="300" stroke="#739A98" strokeOpacity=".14" strokeDasharray="7 7"/>)}
      <text x="160" y="216" fontSize={letter.length>1?134:210} fontWeight="500"
        fontFamily="Georgia, 'Times New Roman', serif" textAnchor="middle" fill="#D5C5A6" opacity=".17">{letter}</text>
      {strokes.map((points,i)=><polyline key={i}
        points={points.map(p=>`${p.x},${p.y}`).join(' ')}
        fill="none" stroke="#EDECF1" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>)}
    </svg>
    <div className="alphabet-trace-actions">
      <button type="button" className="alphabet-outline-button" onClick={clear}>Арилгах</button>
      <span className="alphabet-help">{attempts?'Бичих оролдлого бүртгэгдсэн':'Үсгийн хэлбэрийг хуруугаараа дагуулж бич'}</span>
    </div>
    <p className="alphabet-help">Хэлбэрийг автоматаар зөв/буруу гэж үнэлэхгүй. Зөвхөн бичих оролдлогыг тэмдэглэнэ.</p>
  </div>;
};
