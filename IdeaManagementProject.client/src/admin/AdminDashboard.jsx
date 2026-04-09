import { useEffect, useMemo, useState } from 'react';
import {
    PieChart, Pie, Cell,
    LineChart, Line,
    BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import AdminShell from '../shells/AdminShell';
import { getAuthSession, roleToPath } from '../shared/authStorage';
import { C, card, font } from '../theme';
import {
    fetchOverview,
    fetchRoleDistribution,
    fetchIdeasByCategory,
    fetchPostFrequency,
} from './analyticsApi';

const CHART_COLORS = ['#6366F1','#06B6D4','#10B981','#F59E0B','#EF4444','#8B5CF6'];

function Skeleton({ h=160 }) {
  return <div style={{height:h,borderRadius:'10px',background:'linear-gradient(90deg,#f0f4f8 25%,#e2e8f0 50%,#f0f4f8 75%)',backgroundSize:'200% 100%',animation:'shimmer 1.4s infinite'}}/>;
}

function KpiCard({ icon, label, value, change, accent }) {
  const isPos = change==null||parseFloat(change)>=0;
  return (
    <div style={{...card,padding:'1.25rem',borderTop:`3px solid ${accent||C.primary}`}}>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'0.85rem'}}>
        <div style={{width:'38px',height:'38px',borderRadius:'9px',background:`${accent||C.primary}18`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'17px'}}>{icon}</div>
        {change!=null&&<span style={{fontSize:'10px',fontWeight:700,padding:'2px 7px',borderRadius:'999px',background:isPos?C.successLt:C.dangerLt,color:isPos?C.successDk:C.dangerDk}}>{isPos?'+':''}{change}%</span>}
      </div>
      <div style={{fontSize:'1.9rem',fontWeight:800,color:C.text,lineHeight:1,letterSpacing:'-0.02em'}}>{value??'—'}</div>
      <div style={{fontSize:'11.5px',color:C.textSub,marginTop:'5px'}}>{label}</div>
    </div>
  );
}

export default function AdminDashboard() {
  const session = useMemo(() => getAuthSession(), []);
  const user = session?.user;
  const [overview,setOverview] = useState(null);
  const [roleDistribution,setRoleDistribution] = useState([]);
  const [categoryData,setCategoryData] = useState([]);
  const [postFrequency,setPostFrequency] = useState([]);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState(null);

  useEffect(() => {
    if (!session?.token||!user) { window.location.href='/login'; return; }
    if (user.role!=='ADMIN') { window.location.href=roleToPath(user.role); return; }
    loadAll();
  }, [session, user]);

  async function loadAll() {
    setLoading(true); setError(null);
    try {
      const [ovr,roles,cats,postFreq] = await Promise.all([fetchOverview(),fetchRoleDistribution(),fetchIdeasByCategory(),fetchPostFrequency()]);
      setOverview(ovr);
      setRoleDistribution(roles.map((r,i)=>({name:r.roleName,value:r.count,color:CHART_COLORS[i%CHART_COLORS.length]})));
      setCategoryData(cats.map(c=>({name:c.categoryName,ideas:c.count})));
      setPostFrequency((postFreq.items??[]).map(item=>({month:item.period,posts:item.ideasCount,comments:0})));
    } catch(err) { setError('Failed to load analytics data.'); }
    finally { setLoading(false); }
  }

  if (!session?.token||!user||user.role!=='ADMIN') return null;

  return (
    <AdminShell activeMenu="overview">
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>

      {/* Header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.75rem',flexWrap:'wrap',gap:'1rem'}}>
        <div>
          <h1 style={{margin:'0 0 3px',fontSize:'1.55rem',fontWeight:800,color:C.text,letterSpacing:'-0.02em'}}>Analytics Dashboard</h1>
          <p style={{margin:0,fontSize:'13px',color:C.textSub}}>System overview and real-time activity metrics</p>
        </div>
        <button onClick={loadAll} style={{padding:'0.55rem 1.1rem',border:'none',borderRadius:'8px',background:C.primary,color:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:font,display:'flex',alignItems:'center',gap:'5px'}}>
          {loading?'Loading…':'↺ Refresh'}
        </button>
      </div>

      {error && <div style={{padding:'0.75rem 1rem',borderRadius:'10px',border:'1px solid #FECACA',background:'#FEF2F2',color:'#B91C1C',fontSize:'13px',marginBottom:'1.25rem'}}>⚠️ {error}</div>}

      {/* KPIs */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'1rem',marginBottom:'1.75rem'}}>
        <KpiCard icon="👥" label="Total accounts" value={loading?'…':overview?.totalAccounts?.toLocaleString()} change={overview?.accountsGrowthPercent} accent="#6366F1"/>
        <KpiCard icon="💡" label="Total ideas" value={loading?'…':overview?.totalIdeas?.toLocaleString()} change={overview?.ideasGrowthPercent} accent="#06B6D4"/>
        <KpiCard icon="🏢" label="Departments" value={loading?'…':overview?.totalDepartments?.toLocaleString()} accent="#10B981"/>
        <KpiCard icon="🏷️" label="Categories" value={loading?'…':overview?.totalCategories?.toLocaleString()} accent="#F59E0B"/>
      </div>

      {/* Row 1: Donut + Bar */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1.4fr',gap:'1.25rem',marginBottom:'1.25rem'}}>
        {/* Role distribution */}
        <div style={{...card}}>
          <h2 style={{margin:'0 0 1.1rem',fontSize:'13.5px',fontWeight:700,color:C.text}}>Role Distribution</h2>
          {loading ? <Skeleton h={170}/> : (
            <div style={{display:'flex',alignItems:'center',gap:'1rem'}}>
              <ResponsiveContainer width="50%" height={160}>
                <PieChart><Pie data={roleDistribution} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                  {roleDistribution.map((e,i)=><Cell key={i} fill={e.color}/>)}
                </Pie><Tooltip formatter={v=>v.toLocaleString()}/></PieChart>
              </ResponsiveContainer>
              <div style={{flex:1}}>
                {roleDistribution.map(row=>(
                  <div key={row.name} style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'7px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'7px'}}>
                      <span style={{width:'9px',height:'9px',borderRadius:'50%',background:row.color,display:'inline-block',flexShrink:0}}/>
                      <span style={{fontSize:'12px',color:C.textSub}}>{row.name}</span>
                    </div>
                    <span style={{fontSize:'12px',fontWeight:700,color:C.text}}>{row.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Ideas by category */}
        <div style={{...card}}>
          <h2 style={{margin:'0 0 1.1rem',fontSize:'13.5px',fontWeight:700,color:C.text}}>Ideas by Category</h2>
          {loading ? <Skeleton h={170}/> : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={categoryData} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9"/>
                <XAxis dataKey="name" tick={{fontSize:9}} tickLine={false}/>
                <YAxis tick={{fontSize:9}} tickLine={false} axisLine={false}/>
                <Tooltip contentStyle={{borderRadius:'8px',fontSize:'12px',border:'1px solid #E2E8F0'}}/>
                <Bar dataKey="ideas" fill="#6366F1" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Row 2: Line chart + Placeholder */}
      <div style={{display:'grid',gridTemplateColumns:'1.4fr 1fr',gap:'1.25rem'}}>
        <div style={{...card}}>
          <h2 style={{margin:'0 0 1.1rem',fontSize:'13.5px',fontWeight:700,color:C.text}}>Post Frequency</h2>
          {loading ? <Skeleton h={180}/> : (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={postFrequency}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9"/>
                <XAxis dataKey="month" tick={{fontSize:9}} tickLine={false}/>
                <YAxis tick={{fontSize:9}} tickLine={false} axisLine={false}/>
                <Tooltip contentStyle={{borderRadius:'8px',fontSize:'12px',border:'1px solid #E2E8F0'}}/>
                <Legend wrapperStyle={{fontSize:11}}/>
                <Line type="monotone" dataKey="posts" stroke="#6366F1" strokeWidth={2.5} dot={{r:3,fill:'#6366F1'}} name="Posts"/>
                <Line type="monotone" dataKey="comments" stroke="#06B6D4" strokeWidth={2.5} dot={{r:3,fill:'#06B6D4'}} name="Comments"/>
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

                {/* Placeholder: Users online (no API yet) */}
                <div style={{...card}}>
                    <h2 style={{margin:'0 0 1.1rem',fontSize:'13.5px',fontWeight:700,color:C.text}}>Users online today</h2>
                    <div style={{
                        height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#9CA3AF', fontSize: '13px', border: '1px dashed #E5E7EB', borderRadius: '8px',
                    }}>
                        No API available yet
                    </div>
                </div>
            </div>
        </AdminShell>
    );
}