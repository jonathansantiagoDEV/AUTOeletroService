'use client'

import {useEffect,useState} from 'react'
import {createClient} from '@/lib/supabase/client'

export default function CompanyProfileSettings(){
 const supabase=createClient()
 const [userId,setUserId]=useState('')
 const [data,setData]=useState({name:'',phone:'',logo_url:'',footer_text:''})
 const [msg,setMsg]=useState('')
 const [uploading,setUploading]=useState(false)

 useEffect(()=>{(async()=>{
  const {data:{user}}=await supabase.auth.getUser()
  if(!user)return
  setUserId(user.id)
  const {data:r}=await supabase.from('workshop_profile').select('*').eq('user_id',user.id).maybeSingle()
  if(r)setData({name:r.name||'',phone:r.phone||'',logo_url:r.logo_url||'',footer_text:r.footer_text||''})
 })()},[])

 async function uploadLogo(file:File){
  setUploading(true)
  const ext=file.name.split('.').pop()
  const path=`${userId}/logo-${Date.now()}.${ext}`
  const {error}=await supabase.storage.from('company-logos').upload(path,file,{upsert:true})
  if(error){setMsg(error.message);setUploading(false);return}
  const {data}=supabase.storage.from('company-logos').getPublicUrl(path)
  setData(v=>({...v,logo_url:data.publicUrl}))
  setUploading(false)
 }

 async function save(){
  if(!userId)return
  await supabase.from('workshop_profile').upsert({...data,user_id:userId})
  setMsg('Dados salvos com sucesso')
 }
 return <div className="space-y-3 p-4 border rounded-xl">
  <h3 className="font-semibold">Minha empresa no PDF</h3>
  {data.logo_url && <img src={data.logo_url} className="h-20 object-contain"/>}
  <input type="file" accept="image/*" onChange={e=>e.target.files&&uploadLogo(e.target.files[0])}/>
  <input className="w-full border p-2 rounded" placeholder="Nome da empresa" value={data.name} onChange={e=>setData({...data,name:e.target.value})}/>
  <input className="w-full border p-2 rounded" placeholder="Telefone" value={data.phone} onChange={e=>setData({...data,phone:e.target.value})}/>
  <input className="w-full border p-2 rounded" placeholder="Rodapé do PDF" value={data.footer_text} onChange={e=>setData({...data,footer_text:e.target.value})}/>
  <button className="px-4 py-2 rounded bg-primary text-white" onClick={save}>{uploading?'Enviando logo...':'Salvar'}</button>
  <span>{msg}</span>
 </div>
