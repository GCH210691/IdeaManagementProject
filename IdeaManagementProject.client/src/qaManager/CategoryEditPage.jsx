import { useEffect, useMemo, useState } from 'react';
import { canViewCategoryList, getAuthHeaders, getAuthSession, roleToPath } from '../shared/authStorage';
import StaffShell from '../shells/StaffShell';

export default function CategoryEditPage() {
  const session = useMemo(()=>getAuthSession(),[]);
  const user = session?.user;
  const categoryId = useMemo(()=>{ const m=window.location.pathname.match(/\/qa-manager\/categories\/(\d+)\/edit$/i); return m?Number(m[1]):0; },[]);
  const [category,setCategory]=useState(null);
  const [name,setName]=useState('');
  const [feedback,setFeedback]=useState({type:'info',text:'Loading category…'});
  const [saving,setSaving]=useState(false);

  useEffect(()=>{
    if(!session?.token||!user){window.location.href='/login';return;}
    if(!canViewCategoryList(user)){window.location.href=roleToPath(user.role);return;}
    if(!categoryId){setFeedback({type:'error',text:'Invalid category ID.'});return;}
    let active=true;
    async function load() {
      try {
        const res=await fetch(`/api/qa-manager/categories/${categoryId}`,{headers:getAuthHeaders({Accept:'application/json'})});
        if(res.status===401){window.location.href='/login';return;}
        if(res.status===403){window.location.href=roleToPath(user.role);return;}
        if(res.status===404){setFeedback({type:'error',text:'Category not found.'});return;}
        if(!res.ok){setFeedback({type:'error',text:`Load failed: ${res.status}`});return;}
        const p=await res.json();
        if(!active)return;
        setCategory(p);setName(p?.name||'');setFeedback({type:'info',text:''});
      }catch(e){setFeedback({type:'error',text:'Error: '+(e instanceof Error?e.message:String(e))});}
    }
    load();
    return()=>{active=false;};
  },[session,user,categoryId]);

  async function saveCategory() {
    if(!name.trim()){setFeedback({type:'error',text:'Category name is required.'});return;}
    setSaving(true);setFeedback({type:'info',text:'Saving…'});
    try {
      const res=await fetch(`/api/qa-manager/categories/${categoryId}`,{method:'PUT',headers:getAuthHeaders({'Content-Type':'application/json',Accept:'application/json'}),body:JSON.stringify({name:name.trim()})});
      if(res.status===401){window.location.href='/login';return;}
      if(res.status===403){window.location.href=roleToPath(user?.role);return;}
      const p=await res.json().catch(()=>null);
      if(!res.ok){setFeedback({type:'error',text:p?.message||`Save failed: ${res.status}`});return;}
      setCategory(p);setName(p?.name||'');setFeedback({type:'success',text:'Category updated.'});
    }catch(e){setFeedback({type:'error',text:'Error: '+(e instanceof Error?e.message:String(e))});}
    finally{setSaving(false);}
  }

  if(!session?.token||!user)return null;

  const fb={info:{bg:'#F0F9FF',br:'#BAE6FD',c:'#0369A1'},success:{bg:'#ECFDF5',br:'#A7F3D0',c:'#065F46'},error:{bg:'#FEF2F2',br:'#FECACA',c:'#B91C1C'}}[feedback.type]||{bg:'#F0F9FF',br:'#BAE6FD',c:'#0369A1'};

  return (
    <StaffShell activeMenu="categories">
      <div style={{maxWidth:'560px'}}>
        <button onClick={()=>window.location.href='/qa-manager/categories'} style={{background:'none',border:'none',cursor:'pointer',color:C.textSub,fontSize:'13px',fontWeight:600,padding:'0 0 1rem 0',fontFamily:font,display:'flex',alignItems:'center',gap:'5px'}}>← Back to Categories</button>
        <h1 style={{margin:'0 0 4px',fontSize:'1.55rem',fontWeight:800,color:C.text,letterSpacing:'-0.02em'}}>Edit Category</h1>
        <p style={{margin:'0 0 1.5rem',fontSize:'13px',color:C.textSub}}>Update the category name. Categories with linked ideas cannot be deleted.</p>

        {feedback.text&&<div style={{padding:'0.75rem 1rem',borderRadius:'10px',border:`1px solid ${fb.br}`,background:fb.bg,color:fb.c,fontSize:'13px',marginBottom:'1.25rem'}}>{feedback.text}</div>}

        {category && (
          <div style={{...card}}>
            <div style={{marginBottom:'1.1rem'}}>
              <label style={{display:'block',fontSize:'11px',fontWeight:700,color:C.textSub,marginBottom:'6px',textTransform:'uppercase',letterSpacing:'0.05em'}}>Category Name *</label>
              <input value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')saveCategory();}} placeholder="Category name" disabled={saving}
                style={{width:'100%',boxSizing:'border-box',padding:'0.65rem 0.85rem',borderRadius:'9px',border:`1.5px solid ${C.border}`,fontSize:'14px',color:C.text,fontFamily:font,outline:'none'}}
                onFocus={e=>{e.target.style.borderColor=C.primary;e.target.style.boxShadow=`0 0 0 3px ${C.primaryLt}`;}}
                onBlur={e=>{e.target.style.borderColor=C.border;e.target.style.boxShadow='none';}}/>
            </div>

            {/* Linked ideas */}
            {Array.isArray(category.ideas)&&category.ideas.length>0&&(
              <div style={{marginBottom:'1.25rem',padding:'0.9rem 1rem',borderRadius:'9px',background:'#FFFBEB',border:'1px solid #FDE68A'}}>
                <p style={{margin:'0 0 0.5rem',fontSize:'12px',fontWeight:700,color:'#92400E'}}>⚠ This category is linked to {category.ideas.length} idea{category.ideas.length!==1?'s':''} and cannot be deleted.</p>
                <div style={{display:'flex',flexWrap:'wrap',gap:'4px'}}>{category.ideas.slice(0,5).map(i=><span key={i.ideaId} style={{fontSize:'10.5px',padding:'2px 8px',borderRadius:'999px',background:'#FEF3C7',color:'#92400E',fontWeight:600}}>{i.title}</span>)}{category.ideas.length>5&&<span style={{fontSize:'10.5px',color:'#92400E'}}>+{category.ideas.length-5} more</span>}</div>
              </div>
            )}

            <div style={{display:'flex',gap:'0.75rem',justifyContent:'flex-end'}}>
              <button onClick={()=>window.location.href='/qa-manager/categories'} style={{padding:'0.65rem 1.2rem',border:`1px solid ${C.border}`,borderRadius:'9px',background:'#fff',color:C.textSub,fontSize:'13.5px',fontWeight:600,cursor:'pointer',fontFamily:font}}>Cancel</button>
              <button onClick={saveCategory} disabled={saving} style={{padding:'0.65rem 1.4rem',border:'none',borderRadius:'9px',background:C.primary,color:'#fff',fontSize:'13.5px',fontWeight:700,cursor:saving?'not-allowed':'pointer',fontFamily:font,opacity:saving?0.7:1}}>
                {saving?'Saving…':'Save Changes'}
              </button>
            </div>
          </div>
        )}
      </div>
    </StaffShell>
  );
}
