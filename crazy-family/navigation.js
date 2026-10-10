function blockedBy(blockers,x,z,clearance){
  return blockers.some(b=>Math.abs(x-b.x)<=b.width/2+clearance && Math.abs(z-b.z)<=b.depth/2+clearance);
}

export function buildNavigationGrid({bounds,blockers=[],cellSize=.4,clearance=.5}){
  const cols=Math.floor((bounds.maxX-bounds.minX)/cellSize)+1;
  const rows=Math.floor((bounds.maxZ-bounds.minZ)/cellSize)+1;
  const inCell=(ix,iz)=>ix>=0&&iz>=0&&ix<cols&&iz<rows;
  const toWorld=(ix,iz)=>({x:bounds.minX+ix*cellSize,z:bounds.minZ+iz*cellSize});
  const toCell=(x,z)=>({ix:Math.max(0,Math.min(cols-1,Math.round((x-bounds.minX)/cellSize))),iz:Math.max(0,Math.min(rows-1,Math.round((z-bounds.minZ)/cellSize)))});
  const isBlockedCell=(ix,iz)=>{if(!inCell(ix,iz))return true;const p=toWorld(ix,iz);return blockedBy(blockers,p.x,p.z,clearance);};
  return {
    bounds:{...bounds},blockers:[...blockers],cellSize,clearance,cols,rows,toWorld,toCell,isBlockedCell,
    isBlockedWorld(x,z){return blockedBy(blockers,x,z,clearance);},
    neighbors(ix,iz){
      const out=[];
      for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){
        if(!dx&&!dz)continue;const nx=ix+dx,nz=iz+dz;if(isBlockedCell(nx,nz))continue;
        if(dx&&dz&&(isBlockedCell(ix+dx,iz)||isBlockedCell(ix,iz+dz)))continue;
        out.push({ix:nx,iz:nz,cost:dx&&dz?Math.SQRT2:1});
      }
      return out;
    },
  };
}

function key(c){return `${c.ix},${c.iz}`;}
function heuristic(a,b){return Math.hypot(a.ix-b.ix,a.iz-b.iz);}

function nearestOpen(grid,cell){
  if(!grid.isBlockedCell(cell.ix,cell.iz))return cell;
  for(let radius=1;radius<Math.max(grid.cols,grid.rows);radius++){
    let best=null,bestD=Infinity;
    for(let dz=-radius;dz<=radius;dz++)for(let dx=-radius;dx<=radius;dx++){
      if(Math.max(Math.abs(dx),Math.abs(dz))!==radius)continue;
      const c={ix:cell.ix+dx,iz:cell.iz+dz};if(grid.isBlockedCell(c.ix,c.iz))continue;
      const d=Math.hypot(dx,dz);if(d<bestD){best=c;bestD=d;}
    }
    if(best)return best;
  }
  return null;
}

export function findPath(grid,start,goal,options={}){
  const startCell=nearestOpen(grid,grid.toCell(start.x,start.z));
  const goalCell=nearestOpen(grid,grid.toCell(goal.x,goal.z));
  if(!startCell||!goalCell)return [];
  const open=[startCell],openKeys=new Set([key(startCell)]),came=new Map(),g=new Map([[key(startCell),0]]),f=new Map([[key(startCell),heuristic(startCell,goalCell)]]);
  const maxVisited=options.maxVisited||grid.cols*grid.rows*2;let visited=0;
  while(open.length&&visited++<maxVisited){
    open.sort((a,b)=>(f.get(key(a))??Infinity)-(f.get(key(b))??Infinity));
    const current=open.shift();openKeys.delete(key(current));
    if(current.ix===goalCell.ix&&current.iz===goalCell.iz){
      const cells=[current];let k=key(current);
      while(came.has(k)){const prev=came.get(k);cells.push(prev);k=key(prev);}cells.reverse();
      const points=cells.map(c=>grid.toWorld(c.ix,c.iz));
      if(points.length){points[0]={x:start.x,z:start.z};points[points.length-1]={x:goal.x,z:goal.z};}
      return points;
    }
    for(const n of grid.neighbors(current.ix,current.iz)){
      const nk=key(n),tentative=(g.get(key(current))??Infinity)+n.cost;
      if(tentative>=(g.get(nk)??Infinity))continue;
      came.set(nk,current);g.set(nk,tentative);f.set(nk,tentative+heuristic(n,goalCell));
      if(!openKeys.has(nk)){open.push({ix:n.ix,iz:n.iz});openKeys.add(nk);}
    }
  }
  return [];
}
