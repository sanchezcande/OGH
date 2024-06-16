"use strict";(self.webpackChunkogh=self.webpackChunkogh||[]).push([[571],{702:(e,n,t)=>{t.d(n,{T:()=>i,n:()=>l});var r,a,o=t(581);function s(e,n){return n||(n=e.slice(0)),Object.freeze(Object.defineProperties(e,{raw:{value:Object.freeze(n)}}))}const i=o.Ay.button(r||(r=s(["\n  background-color: rgba(21, 62, 108, 0.34);\n  color: ",";\n  padding: 10px 20px;\n  border: 2px solid #0034EE;\n  border-radius: 4px;\n  cursor: pointer;\n  transition: background-color 0.3s;\n  font-size: 1em;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  \n  &:hover {\n    background-color: #0034EE;\n  }\n"])),(e=>{let{theme:n}=e;return n.colors.secondary})),l=o.Ay.button(a||(a=s(["\n  background-color:  #0034EE;\n  color:   ",";\n  padding: 10px 20px;\n  border: 2px solid #0034EE;\n  border-radius: 4px;\n  cursor: pointer;\n  transition: background-color 0.3s;\n  font-size: 1em;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n\n  &:hover {\n    background-color: rgba(21, 62, 108, 0.34);\n    border: 2px solid #0034EE;\n  }\n"])),(e=>{let{theme:n}=e;return n.colors.secondary}))},571:(e,n,t)=>{t.r(n),t.d(n,{default:()=>H});var r,a,o,s,i,l,c,m,d,p=t(540),u=t(581),f=t(702);function g(e,n){return n||(n=e.slice(0)),Object.freeze(Object.defineProperties(e,{raw:{value:Object.freeze(n)}}))}const h=u.Ay.form(r||(r=g(["\n  display: flex;\n  flex-direction: column;\n  max-width: 500px;\n  margin: auto;\n"]))),b=(0,u.i7)(a||(a=g(["\n  0% {\n    transform: translateY(0);\n  }\n  50% {\n    transform: translateY(-10px);\n  }\n  100% {\n    transform: translateY(0);\n  }\n"]))),x=(0,u.i7)(o||(o=g(["\n  0% {\n    transform: translateY(0);\n  }\n  50% {\n    transform: translateY(10px);\n  }\n  100% {\n    transform: translateY(0);\n  }\n"]))),v=u.Ay.input(s||(s=g(['\n  padding: 10px;\n  margin-bottom: 10px;\n  border: 1px solid #ccc;\n  border-radius: 5px;\n  border: 3px solid #333;\n  transition: all 0.3s;\n  background-color: #f0f0f0;\n\n  &::placeholder {\n    color: #999;\n    font-style: italic;\n  }\n\n  &:focus {\n    border-color: #0034ee;\n    outline: none;\n  }\n  &:hover {\n    border-color: #0034ee;\n  }\n\n  &[type="number"] {\n    -moz-appearance: textfield; /* Firefox */\n    appearance: textfield; /* Safari e IE */\n    &::-webkit-outer-spin-button,\n    &::-webkit-inner-spin-button {\n      display: none; /* WebKit */\n    }\n  }\n  &.error {\n    animation: '," 0.5s ease forwards;\n  }\n\n  &.valid {\n    animation: "," 0.5s ease forwards;\n  }\n"])),b,x),y=u.Ay.textarea(i||(i=g(["\n  padding: 10px;\n  margin-bottom: 10px;\n  border: 1px solid #ccc;\n  border-radius: 5px;\n  border: 3px solid #333;\n  transition: all 0.3s;\n  background-color: #f0f0f0;\n\n  &::placeholder {\n    color: #999;\n    font-style: italic;\n  }\n\n  &:focus {\n    border-color: #0034ee;\n    outline: none;\n  }\n  &:hover {\n    border-color: #0034ee;\n  }\n  &.error {\n    animation: "," 0.5s ease forwards;\n  }\n\n  &.valid {\n    animation: "," 0.5s ease forwards;\n  }\n"])),b,x),w=(0,u.i7)(l||(l=g(["\n  from {\n    opacity: 0;\n    max-height: 0;\n  }\n  to {\n    opacity: 1;\n    max-height: 100px; /* Ajusta este valor según sea necesario */\n  }\n"]))),E=(0,u.i7)(c||(c=g(["\n  from {\n    opacity: 1;\n    max-height: 100px; /* Ajusta este valor según sea necesario */\n  }\n  to {\n    opacity: 0;\n    max-height: 0;\n  }\n"]))),_=u.Ay.div(m||(m=g(["\n  color: white;\n  margin-bottom: 10px;\n  font-size: 10px;\n  margin-left: 10px;\n  opacity: 0;\n  max-height: 0;\n  overflow: hidden;\n  transition: max-height 0.3s ease;\n\n  &.visible {\n    opacity: 1;\n    max-height: 100px;\n    animation: "," 0.3s forwards;\n  }\n\n  &.hidden {\n    opacity: 0;\n    max-height: 0;\n    animation: "," 0.3s forwards;\n  }\n"])),w,E),j=(0,u.Ay)(f.n)(d||(d=g(["\n  display: inline-block;\n  &.error {\n    animation: "," 0.5s ease forwards;\n  }\n\n  &.valid {\n    animation: "," 0.5s ease forwards;\n  }\n"])),b,x);var k,O,z;function A(e,n){return n||(n=e.slice(0)),Object.freeze(Object.defineProperties(e,{raw:{value:Object.freeze(n)}}))}const N=u.Ay.div(k||(k=A(["\n  position: fixed;\n  top: 0;\n  left: 0;\n  width: 100%;\n  height: 100%;\n  background: rgba(0, 0, 0, 0.5);\n  display: flex;\n  justify-content: center;\n  align-items: center;\n"]))),P=u.Ay.div(O||(O=A(["\n  background: white;\n  padding: 20px;\n  border-radius: 10px;\n  text-align: center;\n  max-width: 500px;\n  width: 90%;\n"]))),S=u.Ay.button(z||(z=A(["\n  background: #3498db;\n  color: white;\n  border: none;\n  padding: 10px 20px;\n  border-radius: 5px;\n  cursor: pointer;\n  margin-top: 10px;\n  &:hover {\n    background: #2980b9;\n  }\n"]))),C=e=>{let{message:n,onClose:t}=e;return p.createElement(N,null,p.createElement(P,null,p.createElement("h2",null,"Send!"),p.createElement("p",null,n),p.createElement(S,{onClick:t},"Cerrar")))},T={_origin:"https://api.emailjs.com"};class D{constructor(e){this.status=e.status,this.text=e.responseText}}const Y=(e,n,t,r)=>{const a=r||T._userID,o=(e=>{let n;if(n="string"==typeof e?document.querySelector(e):e,!n||"FORM"!==n.nodeName)throw"The 3rd parameter is expected to be the HTML form element or the style selector of form";return n})(t);((e,n,t)=>{if(!e)throw"The user ID is required. Visit https://dashboard.emailjs.com/admin/integration";if(!n)throw"The service ID is required. Visit https://dashboard.emailjs.com/admin";if(!t)throw"The template ID is required. Visit https://dashboard.emailjs.com/admin/templates"})(a,e,n);const s=new FormData(o);return s.append("lib_version","3.2.0"),s.append("service_id",e),s.append("template_id",n),s.append("user_id",a),((e,n,t={})=>new Promise(((r,a)=>{const o=new XMLHttpRequest;o.addEventListener("load",(({target:e})=>{const n=new D(e);200===n.status||"OK"===n.text?r(n):a(n)})),o.addEventListener("error",(({target:e})=>{a(new D(e))})),o.open("POST",T._origin+e,!0),Object.keys(t).forEach((e=>{o.setRequestHeader(e,t[e])})),o.send(n)})))("/api/v1.0/email/send-form",s)},q=()=>{const[e,n]=(0,p.useState)(""),[t,r]=(0,p.useState)(!1),[a,o]=(0,p.useState)({}),[s,i]=(0,p.useState)({from_name:"",from_email:"",contact_number:"",subject:"",message:""});function l(){const e={};var n,t,r;return(n=s.from_name)&&n.length>2?delete e.from_name:e.from_name="Please enter a valid name",t=s.from_email,/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)?delete e.from_email:e.from_email="Please enter a valid email address",(r=s.message)&&r.length>10?delete e.message:e.message="Please enter a message with more than 10 characters",o(e),e}const c=e=>{const{name:n,value:t}=e.target;i({...s,[n]:t}),l()};return p.createElement("div",null,p.createElement(h,{className:"contact-form",onSubmit:function(e){e.preventDefault(),e.target.from_name.value,e.target.from_email.value,e.target.contact_number.value,e.target.subject.value,e.target.message.value;const t=l();0===Object.keys(t).length?Y("service_jk13omy","template_k5rhtkf",e.target,"DMk76Fu8oF26N7Yse").then((e=>{n("Message sent successfully"),r(!0)}),(e=>{n("Error sending message"),r(!0),console.log(e.text)})):o(t)},noValidate:!0},p.createElement(v,{type:"text",name:"from_name",placeholder:"Name",onChange:c,className:a.from_name?"error":"valid"}),a.from_name&&p.createElement(_,{className:a.from_name?"visible":"hidden"},a.from_name),p.createElement(v,{type:"email",name:"from_email",placeholder:"Email",onChange:c,className:a.from_email?"error":"valid"}),a.from_email&&p.createElement(_,{className:a.from_email?"visible":"hidden"},a.from_email),p.createElement(v,{type:"number",name:"contact_number",placeholder:"Phone number (optional)"}),p.createElement(v,{type:"text",name:"subject",placeholder:"Subject (optional)"}),p.createElement(y,{name:"message",placeholder:"Message",onChange:c,className:a.message?"error":"valid"}),a.message&&p.createElement(_,{className:a.message?"visible":"hidden"},a.message),p.createElement(j,{className:a.message?"error":"valid",type:"submit"},"Send")),t&&p.createElement(C,{message:e,onClose:()=>{r(!1)}}),e&&!e.includes("successfully")&&p.createElement(_,{className:"visible"},e))};var M;const F=u.Ay.div(M||(I=["\n    display: flex;\n    flex-direction: column;\n    margin-bottom: 50px;\n\n    h1 {\n        text-align: center;\n        font-size: 40px;\n        font-weight: 700;\n        margin-bottom: 10px;\n    }\n    h2 {\n        text-align: center;\n        font-size: 30;\n        margin-bottom: 20px;\n        color: #828282;\n        font-weight: 400;\n        margin-bottom: 40px;\n    }\n\n    "],R||(R=I.slice(0)),M=Object.freeze(Object.defineProperties(I,{raw:{value:Object.freeze(R)}}))));var I,R;const H=p.forwardRef(((e,n)=>p.createElement(F,{ref:n},p.createElement("div",{style:{marginBottom:"20px"}}),p.createElement("h1",null,"Have a Question? Reach Out!"),p.createElement("h2",null,"Thank you for contacting us! Please fill out the form below and we'll get back to you shortly."),p.createElement(q,null))))}}]);