import { useEffect, useMemo, useState } from 'react';
import { BASE_URL, canViewCategoryList, getAuthHeaders, getAuthSession, roleToPath } from '../shared/authStorage';
import StaffShell from '../shells/StaffShell';
import { C, card, font } from '../shared/designTokens';

const inp = {width:'100%',boxSizing:'border-box',padding:'0.55rem 0.75rem',borderRadius:'7px',border:`1.5px solid ${C.border}`,fontSize:'13px',color:C.text,fontFamily:font,outline:'none'};

export default function CategoryListPage() {
  const session = useMemo(()=>getAuthSession(),[]);
  const user = session?.user;
  const [categories,setCategories]=useState([]);
  const [search,setSearch]=useState('');
  const [createName,setCreateName]=useState('');
  const [feedback,setFeedback]=useState({type:'info',text:'Loading…'});
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);

  async function loadCategories(showMsg=false) {
    setLoading(true);
      try {
      const res = await fetch(`${BASE_URL}/api/qa-manager/categories`, { headers: getAuthHeaders({ Accept: 'application/json' }) });
      if(res.status===401){window.location.href='/login';return;}
      if(res.status===403){window.location.href=roleToPath(user?.role);return;}
      if(!res.ok){setFeedback({type:'error',text:`Load failed: ${res.status}`});return;}
      const data=await res.json();
      const nextCats=Array.isArray(data)?data:[];
      setCategories(nextCats);
      setFeedback(showMsg?{type:'success',text:`Loaded ${nextCats.length} categories.`}:{type:'info',text:''});
    }catch(e){setFeedback({type:'error',text:'Load error: '+(e instanceof Error?e.message:String(e))});}
    finally{setLoading(false);}
  }

  useEffect(()=>{
    if(!session?.token||!user){window.location.href='/login';return;}
    if(!canViewCategoryList(user)){window.location.href=roleToPath(user.role);return;}
    loadCategories();
  },[session,user]);

  const filteredCats = useMemo(()=>{ const q=search.trim().toLowerCase(); if(!q)return categories; return categories.filter(c=>String(c.name||'').toLowerCase().includes(q)); },[categories,search]);
  const summary = useMemo(()=>{
    const total=categories.length;
    const used=categories.filter(c=>Array.isArray(c.ideas)&&c.ideas.length>0).length;
    const links=categories.reduce((s,c)=>s+(Array.isArray(c.ideas)?c.ideas.length:0),0);
    return [{label:'Total',value:total,accent:'#6366F1'},{label:'Used',value:used,accent:'#10B981'},{label:'Unused',value:total-used,accent:'#F59E0B'},{label:'Idea links',value:links,accent:'#06B6D4'}];
  },[categories]);

  async function createCategory() {
    if(!createName.trim()){setFeedback({type:'error',text:'Category name is required.'});return;}
    setSaving(true);setFeedback({type:'info',text:'Creating…'});
      try {
      const res = await fetch(`${BASE_URL}/api/qa-manager/categories`, { method: 'POST', headers: getAuthHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' }), body: JSON.stringify({ name: createName.trim() }) });
      if(res.status===401){window.location.href='/login';return;}
      if(res.status===403){window.location.href=roleToPath(user?.role);return;}
      const p=await res.json().catch(()=>null);
      if(!res.ok){setFeedback({type:'error',text:p?.message||`Create failed: ${res.status}`});return;}
      setCategories(c=>[...c,p]);setCreateName('');setFeedback({type:'success',text:'Category created.'});
    }catch(e){setFeedback({type:'error',text:'Error: '+(e instanceof Error?e.message:String(e))});}
    finally{setSaving(false);}
  }

  async function deleteCategory(cat) {
    if(!window.confirm(`Delete "${cat.name}"?`))return;
    setSaving(true);setFeedback({type:'info',text:'Deleting…'});
      try {
      const res = await fetch(`${BASE_URL}/api/qa-manager/categories/${cat.categoryId}`, { method: 'DELETE', headers: getAuthHeaders({ Accept: 'application/json' }) });
      if(res.status===401){window.location.href='/login';return;}
      if(res.status===403){window.location.href=roleToPath(user?.role);return;}
      if(res.status===409){const p=await res.json().catch(()=>null);setFeedback({type:'error',text:p?.message||'Category is in use.'});return;}
      if(!res.ok){const p=await res.json().catch(()=>null);setFeedback({type:'error',text:p?.message||`Delete failed: ${res.status}`});return;}
      setCategories(c=>c.filter(i=>i.categoryId!==cat.categoryId));setFeedback({type:'success',text:'Category deleted.'});
    }catch(e){setFeedback({type:'error',text:'Error: '+(e instanceof Error?e.message:String(e))});}
    finally{setSaving(false);}
  }

  if(!session?.token||!user)return null;

  const fb={info:{bg:'#F0F9FF',br:'#BAE6FD',c:'#0369A1'},success:{bg:'#ECFDF5',br:'#A7F3D0',c:'#065F46'},error:{bg:'#FEF2F2',br:'#FECACA',c:'#B91C1C'}}[feedback.type]||{bg:'#F0F9FF',br:'#BAE6FD',c:'#0369A1'};

  return (
    <StaffShell activeMenu="categories" footerText={`${categories.length} categories`}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.75rem',flexWrap:'wrap',gap:'1rem'}}>
        <div>
          <h1 style={{margin:'0 0 4px',fontSize:'1.55rem',fontWeight:800,color:C.text,letterSpacing:'-0.02em'}}>Category List</h1>
          <p style={{margin:0,fontSize:'13px',color:C.textSub}}>Create, review, edit, and delete idea categories.</p>
        </div>
        <button onClick={()=>loadCategories(true)} style={{padding:'0.55rem 1rem',border:'none',borderRadius:'8px',background:C.primary,color:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:font}}>↺ Refresh</button>
      </div>

      {feedback.text&&<div style={{padding:'0.75rem 1rem',borderRadius:'10px',border:`1px solid ${fb.br}`,background:fb.bg,color:fb.c,fontSize:'13px',fontWeight:500,marginBottom:'1.25rem'}}>{feedback.text}</div>}

      {/* Stats */}
      <div style={{display:'flex',gap:'1rem',marginBottom:'1.5rem',flexWrap:'wrap'}}>
        {summary.map(s=>(
          <div key={s.label} style={{...card,padding:'1.1rem',flex:1,minWidth:'130px',borderTop:`3px solid ${s.accent}`}}>
            <div style={{fontSize:'1.7rem',fontWeight:800,color:C.text,lineHeight:1}}>{loading?'…':s.value}</div>
            <div style={{fontSize:'11.5px',color:C.textSub,marginTop:'5px'}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Create */}
      <div style={{...card,marginBottom:'1.25rem',display:'flex',gap:'0.75rem',alignItems:'center',flexWrap:'wrap'}}>
        <input value={createName} onChange={e=>setCreateName(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')createCategory();}} placeholder="New category name…" disabled={saving}
          style={{...inp,flex:1,minWidth:'200px'}}/>
        <button onClick={createCategory} disabled={saving} style={{padding:'0.55rem 1.1rem',border:'none',borderRadius:'7px',background:C.primary,color:'#fff',fontSize:'13px',fontWeight:600,cursor:saving?'not-allowed':'pointer',fontFamily:font,whiteSpace:'nowrap'}}>
          {saving?'…':'+ Create Category'}
        </button>
      </div>

      {/* Table */}
      <div style={{...card}}>
        <div style={{display:'flex',gap:'0.75rem',alignItems:'center',marginBottom:'1rem',flexWrap:'wrap'}}>
          <div style={{position:'relative',flex:1,minWidth:'200px'}}>
            <span style={{position:'absolute',left:'0.75rem',top:'50%',transform:'translateY(-50%)',color:C.textMuted,fontSize:'13px'}}>🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search categories…" style={{...inp,paddingLeft:'2.1rem',background:'#F8FAFC',width:'100%',boxSizing:'border-box'}}/>
          </div>
          <span style={{fontSize:'12px',color:C.textMuted,fontWeight:600}}>{filteredCats.length} of {categories.length}</span>
        </div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:'13.5px'}}>
            <thead>
              <tr style={{background:'#F8FAFC'}}>
                {['Category Name','Idea Count','Actions'].map(h=><th key={h} style={{padding:'10px 14px',textAlign:'left',fontSize:'11px',fontWeight:700,color:C.textMuted,textTransform:'uppercase',letterSpacing:'0.05em',borderBottom:`2px solid ${C.border}`}}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {filteredCats.map((cat,i)=>{
                const count=Array.isArray(cat.ideas)?cat.ideas.length:0;
                return (
                  <tr key={cat.categoryId} style={{background:i%2===0?'#fff':'#FAFBFF'}}>
                    <td style={{padding:'12px 14px',borderBottom:`1px solid ${C.border}`}}>
                      <div style={{fontWeight:600,color:C.text}}>{cat.name}</div>
                      <div style={{fontSize:'11px',color:C.textMuted}}>ID: {cat.categoryId}</div>
                    </td>
                    <td style={{padding:'12px 14px',borderBottom:`1px solid ${C.border}`}}>
                      <span style={{display:'inline-block',padding:'2px 9px',borderRadius:'999px',fontSize:'11.5px',fontWeight:700,background:count>0?C.primaryLt:'#F1F5F9',color:count>0?C.primaryDk:C.textMuted}}>{count} ideas</span>
                    </td>
                    <td style={{padding:'12px 14px',borderBottom:`1px solid ${C.border}`}}>
                      <div style={{display:'flex',gap:'6px'}}>
                        <button onClick={()=>window.location.href=`/qa-manager/categories/${cat.categoryId}/edit`} style={{padding:'5px 12px',border:'none',borderRadius:'6px',background:C.infoLt,color:C.infoDk,fontSize:'12px',fontWeight:700,cursor:'pointer',fontFamily:font}}>Edit</button>
                        {count===0&&<button onClick={()=>deleteCategory(cat)} disabled={saving} style={{padding:'5px 12px',border:'none',borderRadius:'6px',background:C.dangerLt,color:C.dangerDk,fontSize:'12px',fontWeight:700,cursor:'pointer',fontFamily:font}}>Delete</button>}
                        {count>0&&<span style={{padding:'5px 12px',fontSize:'12px',color:C.textMuted}}>In use</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loading&&filteredCats.length===0&&<tr><td colSpan={3} style={{padding:'2rem',textAlign:'center',color:C.textMuted,fontSize:'13px'}}>No categories found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </StaffShell>
  );
}
