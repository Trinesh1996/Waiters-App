module.exports = function (waiters) {

    async function welcomePage (req, res, next) { 
        res.render('welcome')
   
    }
  
    async function waitersModalHome (req, res, next) {  
        let showDay = await waiters.showDays(); 
        let showWaiter = await waiters.getWaiter()
  
        res.render('home', {showDay, showWaiter}) 
    }
  
    async function forWaitersEnterName (req, res, next) {
   
        let user = req.body.name;
        user = user.charAt(0).toUpperCase() + user.slice(1).toLowerCase();      
        let char = /^[A-Za-z]+$/;
      
        if (user == undefined) {
          return false
        }        
        let showDay = await waiters.showDays();
        let showWaiter = await waiters.getWaiter()
        let addWaiter =  await waiters.addWaiter(user);
       
        if (addWaiter == false || addWaiter == "") {
          req.flash('error', 'You forgot to enter your name');
        }

        res.redirect('/waiters/' + user)
    }
  
    async function selectedDays (req, res, next) {
     
            let user = req.params.username 
            let days = req.body.weekdays;
            let submitted = `Thanks for Submitting`
            let notSubmitted = `Please Select Your Shift`
            let showDay = await waiters.showDays(); 
            let showWaiter = await waiters.getWaiter();
          
            let waiter = `${user}`;
        
            if (days == undefined || days == "") {
              res.render('home', {notSubmitted, waiter, showWaiter})
            }    
        
            else if (days != undefined || days != "" && user != undefined || user != "") {
              await waiters.addWaiter(user);
              let assign = await waiters.assignShifts(days, user);
             
              res.render('home', {submitted, waiter, showWaiter})
        
            }
          }

    async function displayMatchedDays (req, res, next) {
     
        let user = req.params.username;
        let match = await waiters.matchCheckDays(user);
        var showDay = await waiters.showDays();
        let showWaiter = await waiters.getWaiter()       
       
        let message = `Hello ${user}, Please Select Your Shift.`;       
        res.render('selectShift', {showDay,match,user,showWaiter,message});

    
    }

    async function displayShifts (req, res, next) {
    
        let data = await waiters.displayShifts()
        let showWaiter = await waiters.getWaiter()
      
        res.render("waiter_shifts", {data, showWaiter});
        
  
    }

    async function reset (req, res, next) {    
            await waiters.reset();

            res.redirect('/');
    }
  
    return {
        welcomePage,
        waitersModalHome,
        forWaitersEnterName,
        selectedDays,
        displayMatchedDays,
        displayShifts,
        reset  
    }
  }