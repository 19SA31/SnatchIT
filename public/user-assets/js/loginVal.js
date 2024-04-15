const emailId=document.getElementById('typeEmailX')
const passId=document.getElementById('typePasswordX')
const error1=document.getElementById('error1')
const error2=document.getElementById('error2')
const logForm=document.getElementById('logform')

function emailvalidate(){
    const emailval=emailId.value
    const emailpattern= /^([a-zA-Z0-9._-]+)@([a-zA-Z.-]+).([a-zA-z]{2,4})$/;
    if(!emailpattern.test(emailval)){
        error1.style.display="block"
        error1.innerHTML="invalid format!"

    }else{
        error1.style.display="none"
        error1.innerHTML=""
    }
}

function passvalidate(){
    const passval=passId.value
    const alpha=/[a-zA-Z]/;
    const digit=/\d/;
    if(passval.length<8){
        error2.style.display="block"
        error2.innerHTML="must have 8 characters!"

    }else if(!alpha.test(passval)||!digit.test(passval)){
        error2.style.display="block"
        error2.innerHTML="should contain numbers and alphabet!"
    }else if(passval.trim()===""){
        error2.style.display="block"
        error2.innerHTML="please enter the password"
    }else{
        error2.style.display="none"
        error2.innerHTML=""
    }

}
emailId.addEventListener('blur',emailvalidate)
passId.addEventListener('blur',passvalidate)

logForm.addEventListener('submit',function(e){
    emailvalidate()
    passvalidate()
    if(error1.innerHTML !==""||error2.innerHTML!==""){
        e.preventDefault()
    }
})