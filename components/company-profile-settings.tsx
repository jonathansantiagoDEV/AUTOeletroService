'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ImagePlus, Building2, Phone, FileText, Trash2 } from 'lucide-react'

export default function CompanyProfileSettings() {

  const supabase = createClient()
  const inputRef = useRef<HTMLInputElement>(null)

  const [userId, setUserId] = useState('')
  const [data, setData] = useState({
    company_name: '',
    phone: '',
    logo_url: '',
    footer_text: ''
  })

  const [msg,setMsg] = useState('')
  const [uploading,setUploading] = useState(false)


  useEffect(()=>{

    (async()=>{

      const {data:{user}} = await supabase.auth.getUser()

      if(!user) return

      setUserId(user.id)

      const {data:r} = await supabase
        .from('workshop_profile')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if(r){
        setData({
          company_name:r.company_name || '',
          phone:r.phone || '',
          logo_url:r.logo_url || '',
          footer_text:r.footer_text || ''
        })
      }

    })()

  },[])


  async function uploadLogo(file:File){

    setUploading(true)

    const ext = file.name.split('.').pop()

    const path = `${userId}/logo-${Date.now()}.${ext}`

    const {error} = await supabase.storage
      .from('company-logos')
      .upload(path,file,{upsert:true})


    if(error){

      setMsg(error.message)
      setUploading(false)
      return

    }


    const {data} = supabase.storage
      .from('company-logos')
      .getPublicUrl(path)


    setData(v=>({
      ...v,
      logo_url:data.publicUrl
    }))


    setUploading(false)

  }


  async function save(){

    if(!userId) return

    await supabase
      .from('workshop_profile')
      .upsert({
        ...data,
        user_id:userId
      })

    setMsg('Dados salvos com sucesso')

  }


  return (

    <div className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm">

      <div>
        <h2 className="text-xl font-bold text-primary">
          IDENTIDADE DA SUA OFICINA
        </h2>

        <p className="text-sm text-muted-foreground">
          Configure as informações que aparecerão nos seus documentos.
        </p>
      </div>


      <div className="grid gap-6 md:grid-cols-2">


        <div>

          <h3 className="font-semibold mb-2">
            Logo da sua oficina
          </h3>

          <p className="text-sm text-muted-foreground mb-4">
            Essa logo será exibida nos seus PDFs
          </p>


          {!data.logo_url ? (

            <label
              className="
              flex h-64 cursor-pointer flex-col
              items-center justify-center
              rounded-2xl border-2 border-dashed
              border-primary/40 bg-primary/5
              hover:bg-primary/10 transition
              "
            >

              <ImagePlus className="h-14 w-14 text-primary mb-4"/>

              <span className="font-semibold text-center">
                Clique para adicionar
                <br/>
                sua logo
              </span>

              <span className="text-sm text-muted-foreground mt-2">
                ou arraste o arquivo aqui
              </span>

              <span className="text-xs text-muted-foreground mt-3">
                PNG ou JPG • Máx. 5MB
              </span>


              <input
                ref={inputRef}
                hidden
                type="file"
                accept="image/*"
                onChange={e =>
                  e.target.files &&
                  uploadLogo(e.target.files[0])
                }
              />

            </label>


          ) : (

            <div className="
              relative flex h-64 items-center
              justify-center rounded-2xl
              border border-border bg-background shadow-sm
            ">

              <img
                src={data.logo_url}
                className="
                max-h-52 max-w-full
                rounded-2xl object-contain
                "
              />


              <button
                type="button"
                onClick={()=>
                  setData(v=>({...v,logo_url:''}))
                }
                className="
                absolute right-3 top-3
                rounded-full bg-card p-2
                text-red-600 shadow
                "
              >
                <Trash2 size={18}/>
              </button>

            </div>

          )}

        </div>



        <div className="space-y-4">


          <div>
            <label className="font-semibold">
              Nome da oficina
            </label>

            <div className="flex items-center border border-border rounded-xl mt-2">
              <Building2 className="mx-3 text-muted-foreground"/>
              <input
                className="w-full bg-transparent p-3 text-foreground outline-none placeholder:text-muted-foreground"
                value={data.company_name}
                onChange={e=>
                  setData({...data,company_name:e.target.value})
                }
              />
            </div>
          </div>


          <div>
            <label className="font-semibold">
              Telefone
            </label>

            <div className="flex items-center border border-border rounded-xl mt-2">
              <Phone className="mx-3 text-muted-foreground"/>
              <input
                className="w-full bg-transparent p-3 text-foreground outline-none placeholder:text-muted-foreground"
                value={data.phone}
                onChange={e=>
                  setData({...data,phone:e.target.value})
                }
              />
            </div>
          </div>


          <div>
            <label className="font-semibold">
              Rodapé do PDF
            </label>

            <div className="flex items-center border border-border rounded-xl mt-2">
              <FileText className="mx-3 text-muted-foreground"/>
              <input
                className="w-full bg-transparent p-3 text-foreground outline-none placeholder:text-muted-foreground"
                value={data.footer_text}
                onChange={e=>
                  setData({...data,footer_text:e.target.value})
                }
              />
            </div>
          </div>


        </div>

      </div>


      <button
        onClick={save}
        className="
        w-full rounded-xl
        bg-primary py-4
        font-bold text-white
        hover:opacity-90
        "
      >
        {uploading ? 'Enviando logo...' : 'Salvar alterações'}
      </button>


      {msg && (
        <p className="text-sm text-green-600">
          {msg}
        </p>
      )}

    </div>

  )
}
