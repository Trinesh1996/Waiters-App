module.exports = function(pool) {   

    async function addWaiter (name) {

        name = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
     
        if (name == undefined || name == "") {
            return false
        }
        let waiter = await pool.query('SELECT * from waiters where waiter = $1', [name]);
            
        if (waiter.rowCount === 0) {
            await pool.query('INSERT into waiters(waiter) values ($1)', [name]);
            return true;
        }
        return waiter
    }

   
    async function assignShifts (weekdaysID, waiterID) {
        let setUser = await pool.query("SELECT id from waiters where waiter = $1", [waiterID]);
        let userID = setUser.rows[0].id;        
        
        if (weekdaysID == undefined || weekdaysID == "") {
            return false;
        }
        
        await pool.query("DELETE from shifts where waiter_id = $1", [userID])
        
        
        if (!Array.isArray(weekdaysID)) {
            let days = await pool.query("SELECT id from weekdays where week_days = $1", [weekdaysID]);
            await pool.query("INSERT into shifts (waiter_id, days_id) values ($1, $2)", [setUser.rows[0].id, days.rows[0].id]);
        }      
        else {
            for (var i=0; i<weekdaysID.length; i++) {
                let weekdays = weekdaysID[i];
                if (weekdays) {
                    
                    let days = await pool.query("SELECT id from weekdays where week_days = $1", [weekdays]);
                                    
                     
                    await pool.query("INSERT into shifts (waiter_id, days_id) values ($1, $2)", [setUser.rows[0].id, days.rows[0].id]);
                }   
                else {
                    return;
                }
            }
        }
    }
    async function waiters(waiter) {
        let join = await pool.query(`SELECT waiters.id as waiter_id, waiters.waiter, shifts.days_id as day_id, weekdays as week_day
        FROM waiters
        JOIN shifts on waiters.id = shifts.waiter_id
        JOIN weekdays on weekdays.id = shifts.days_id where waiter = $1;`, [waiter]);
        return join.rows;
    }

    async function matchDaysJoin(waiter){
        let join = await pool.query(`SELECT waiter_id, days_id, weekdays.week_days, waiters.waiter
        FROM shifts 
        JOIN waiters 
        ON shifts.waiter_id = waiters.id 
        JOIN weekDays
        ON shifts.days_id = weekdays.id where waiter = $1`, [waiter]);

        return join.rows;
    }

    async function matchCheckDays (user) {
        let match = await showDays()
        let waiter = await matchDaysJoin(user);    

        for (let waiterNames of waiter) {
            for (let weekday of match) {
                if (waiterNames.week_days === weekday.week_days) {
                    weekday.checked = 'checked'
                }
                else if (weekday.checked) {
                    weekday.color = 'color'
                }
            }           
        }       
        return match;        
    }   

    async function getShifts() {
        let join = await pool.query(`SELECT waiter_id, days_id, weekdays.week_days, waiters.waiter
        FROM shifts 
        JOIN waiters 
        ON shifts.waiter_id = waiters.id 
        JOIN weekDays
        ON shifts.days_id = weekdays.id;`);
        
        return join.rows;
    }  

    async function displayShifts() {
        let matched = await showDays();    

        for (let weeks of matched) {

            let getShifts = await pool.query(`SELECT waiters.waiter as waiter
            FROM shifts
            INNER JOIN waiters 
            ON shifts.waiter_id = waiters.id 
            INNER JOIN weekdays 
            ON shifts.days_id = weekdays.id where weekdays.id = $1;`, [weeks.id]);
           
            weeks.users = getShifts.rows;       

        if (weeks.users.length == 0 ) {
                weeks.marked = 'nothing'
            }

         if (weeks.users.length > 0 && weeks.users.length < 3) {
             weeks.marked = 'smallerThanThree'
         }
    
         else if (weeks.users.length === 3) {
             weeks.marked = "equalThree"
         }
         else if (weeks.users.length > 3) {
             weeks.marked = "greaterThanThree"
         }

        }
        return matched
    }

    async function getWaiters() {
        var results = await pool.query('select waiter from waiters');
        return results.rows;
    }

    async function getNames(name) {
        var result = await pool.query('select * from waiters where waiter = $1', [name]);
        return result.rows;
    }

    async function getShiftsIDs() {
        let result = await pool.query('select waiter_id, days_id from shifts');
        return result.rows
    }

    async function getWaiterById(id) {
        let results = await pool.query('select waiter from waiters where id = $1', [id]);
        return results.rows;
    }

    async function getWeekDays() {
        let result = await pool.query('select * from weekdays');
        return result.rows;
    }

    async function getWaiter() {
        let result = await pool.query('select * from waiters');
        return result.rows;

    }
    async function getWeekDayByID(id) {
        let result = await pool.query('select week_days from weekdays where id = $1', [id]);
        return result.rows;
    }

    async function del(user){
        let del = await pool.query("DELETE from shifts where waiter_id = $1", [user]);
        return del.rows;
    }
    async function showDays () {
        var getDays = await pool.query("select * from weekdays");
        return getDays.rows
    }
    async function reset() {
        let reset_shifts = await pool.query("DELETE from shifts");
        let reset_shiftsID = await pool.query("ALTER SEQUENCE shifts_id_seq RESTART 1");
        let reset_waiters = await pool.query("DELETE FROM waiters;");
        let reset_waitersID = await pool.query("ALTER SEQUENCE waiters_id_seq RESTART 1;");
       
        return {
            resetshifts: reset_shifts.rows,
            resetshiftsID: reset_shiftsID.rows,
            resetwaiters: reset_waiters.rows,
            resetwaitersID: reset_waitersID.rows
            
        }
    }

    return {
        reset,
        showDays,
        addWaiter,
        getWaiters,
        getWaiterById,
        getWeekDays,
        getWeekDayByID,
        getNames,
        matchCheckDays,
        assignShifts,
        waiters,
        displayShifts,
        getShifts,
        getShiftsIDs,
        getWaiter,
        matchDaysJoin,
        del
    }
}