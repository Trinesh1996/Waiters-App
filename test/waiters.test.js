'use strict'
let assert = require("assert");
let waiters = require("../public/waiters");
let pg = require("pg");
let Pool = pg.Pool


const connectionString = process.env.DATABASE_URL || 'postgresql://trinesh:Trinesh1997@@localhost:5432/WaitersApp';

const pool = new Pool({
    connectionString

});


describe("Checks Waiters and Weekdays", async function(){
	beforeEach(async function (){  
        await pool.query("DELETE from shifts")
        await pool.query("ALTER SEQUENCE shifts_id_seq RESTART 1;");    
		await pool.query("DELETE FROM waiters;");
        await pool.query("ALTER SEQUENCE waiters_id_seq RESTART 1;");
    })

        it('should return all the waiters in database', async function(){
            let waiter = waiters(pool);
            await waiter.addWaiter("Trinesh");
            await waiter.addWaiter("Mike")

            assert.deepEqual(await waiter.getWaiters(), [{waiter: "Trinesh"},{waiter: "Mike"}])
        });


        it('should return the waiter by id from the database', async function(){
            let waiter = waiters(pool);
            await waiter.addWaiter("Trinesh");
            await waiter.addWaiter("Mike");

            assert.deepEqual(await waiter.getWaiterById(1), [{waiter: "Trinesh"}]);

        });

        it ('should return all the weekdays from database', async function() {
            let waiter = waiters(pool);           

            assert.deepEqual(await waiter.getWeekDays(), [{ id: 1, week_days: 'Monday'}, { id: 2, week_days: 'Tuesday' }, 
                { id: 3, week_days: 'Wednesday'},
                { id: 4, week_days: 'Thursday'},
                { id: 5, week_days: 'Friday'},
                { id: 6, week_days: 'Saturday'},
                { id: 7, week_days: 'Sunday'}])
        });

        it ('should return a weekday by id', async function(){
            let waiter = waiters(pool);

            assert.deepEqual(await waiter.getWeekDayByID(1), [{week_days: "Monday"}]);
            assert.deepEqual(await waiter.getWeekDayByID(3), [{week_days: "Wednesday"}]);
            assert.deepEqual(await waiter.getWeekDayByID(7), [{week_days: "Sunday"}]);
        });
    });

describe('Checks Shifts', async function() {
    beforeEach(async function (){  
        await pool.query("DELETE from shifts")
        await pool.query("ALTER SEQUENCE shifts_id_seq RESTART 1;");    
        await pool.query("DELETE FROM waiters;");
        await pool.query("ALTER SEQUENCE waiters_id_seq RESTART 1;");
    });

        it('should return shifts for waiter', async function() {
            let waiter = waiters(pool);

            await waiter.addWaiter("Trinesh");
            await waiter.addWaiter("Mike");
            await waiter.assignShifts(['Monday', 'Tuesday'], 'Mike');

            assert.deepEqual(await waiter.getWaiters(), [{waiter: 'Trinesh'}, {waiter: 'Mike'}]);
            
            assert.deepEqual(await waiter.getShiftsIDs(), [{waiter_id: 2, days_id: 1},
                                                            {waiter_id: 2, days_id: 2}])
        });

        it('should add one shift entry for waiter', async function(){
            let waiter = waiters(pool);

            await waiter.addWaiter('Trinesh');
            await waiter.assignShifts('Thursday', 'Trinesh');
            assert.deepEqual(await waiter.getShiftsIDs(), [{waiter_id: 1, days_id: 4}]);
        });

        it('adds waiters and assigns each waiter days to work, then returns waiter by id', async function() {
            let waiter = waiters(pool)
            // Add Waiters
            await waiter.addWaiter('Trinesh');
            await waiter.addWaiter('Mike');
            await waiter.addWaiter('jesse');
            await waiter.addWaiter('Lany');
            await waiter.addWaiter('Mark');
            await waiter.addWaiter('Julie');
            
            //Assign Shifts
            // Thursday Empty
            // Monday two: Trinesh Juli
            // Tuesday three: Trinesh, Julie, Mike
            // Friday four: Trinesh, Mike, Lany, Mark
            await waiter.assignShifts(['Monday', 'Tuesday', 'Friday'], 'Trinesh');
            await waiter.assignShifts(['Sunday', 'Monday', 'Tuesday', 'Wednesday'], 'Julie');

            await waiter.assignShifts(['Wednesday', 'Tuesday', 'Friday'], 'Mike');
            await waiter.assignShifts(['Saturday', 'Friday'], 'Lany');
            await waiter.assignShifts('Friday', 'Mark')

            // check waiters by id
            assert.deepEqual(await waiter.getWaiterById(1), [{waiter: "Trinesh"}]);
            assert.deepEqual(await waiter.getWaiterById(2), [{waiter: "Mike"}]);
            assert.deepEqual(await waiter.getWaiterById(3), [{waiter: "Jesse"}]);
            assert.deepEqual(await waiter.getWaiterById(4), [{waiter: "Lany"}])
            assert.deepEqual(await waiter.getWaiterById(5), [{waiter: "Mark"}])
            assert.deepEqual(await waiter.getWaiterById(6), [{waiter: "Julie"}])

        });

        it('Checks the shifts for the week', async()=>{
            let waiter = waiters(pool)

            await waiter.addWaiter('Trinesh');
            await waiter.addWaiter('Mark');
            await waiter.addWaiter('jerry');
            await waiter.addWaiter('Sanjay')
            
            await waiter.assignShifts(['Monday', 'Tuesday', 'Friday', 'Wednesday'], 'Trinesh');
            await waiter.assignShifts(['Monday', 'Wednesday'], 'Mark');
            await waiter.assignShifts(['Monday', 'Wednesday'], 'Jerry');
            await waiter.assignShifts(['Sunday', 'Wednesday'], 'Sanjay');

            let displayShifts = await waiter.displayShifts();
            
            // Display shifts for Monday: Color Green = 3
            assert.deepEqual(await displayShifts[0].users, [ { waiter: 'Trinesh' },
            { waiter: 'Mark' }, {waiter: 'Jerry'}]);

            // Display Shifts for Tuesday: Color Yello < 3
            assert.deepEqual(await displayShifts[1].users, [ { waiter: 'Trinesh' }]);
        
            //Display Shifts for Wednesday: Color Red > 3
            assert.deepEqual(await displayShifts[2].users, [ { waiter: 'Trinesh' },
            { waiter: 'Mark' },
            { waiter: 'Jerry' },
            { waiter: 'Sanjay' }]);

            //Shifts for Thursday = emtpy: Color Purple = 0
            assert.deepEqual(await displayShifts[3].users, []);
            //Shifts for Friday = emtpy: Color Yello < 3
            assert.deepEqual(await displayShifts[4].users, [ { waiter: 'Trinesh' } ] );
            //Shifts for Saturday = emtpy: Color Purple = 0
            assert.deepEqual(await displayShifts[5].users, []);
            //Shifts for Sunday = emtpy: Color Purple = 0
            assert.deepEqual(await displayShifts[6].users, [ { waiter: 'Sanjay' } ] );
        })
    });

describe('Should change color based on the amount of waiters working for each day', async() => {
    beforeEach(async function (){  
        await pool.query("DELETE from shifts")
        await pool.query("ALTER SEQUENCE shifts_id_seq RESTART 1;");    
        await pool.query("DELETE FROM waiters;");
        await pool.query("ALTER SEQUENCE waiters_id_seq RESTART 1;");
    });

    it('checks the color for Monday', async function() {
        let waiter = waiters(pool)

        await waiter.addWaiter('Trinesh');
        await waiter.addWaiter('Mark');
        await waiter.addWaiter('jerry');
        await waiter.addWaiter('Sanjay')
        
        await waiter.assignShifts(['Monday', 'Tuesday', 'Friday', 'Wednesday'], 'Trinesh');
        await waiter.assignShifts(['Monday', 'Wednesday'], 'Mark');
        await waiter.assignShifts(['Monday', 'Wednesday'], 'Jerry');
        await waiter.assignShifts(['Sunday', 'Wednesday'], 'Sanjay');

        let displayShifts = await waiter.displayShifts();
        
        // Display shifts for Monday: Color Green = 3
        assert.deepEqual(await displayShifts[0].users, [ { waiter: 'Trinesh' },
        { waiter: 'Mark' }, {waiter: 'Jerry'}]);
        // Checks the color
        assert.deepEqual(await displayShifts[0].marked, 'equalThree');
    })

    it('checks the color for Tuesday', async function() {
        let waiter = waiters(pool)

        await waiter.addWaiter('Trinesh');
        await waiter.addWaiter('Mark');
        await waiter.addWaiter('jerry');
        await waiter.addWaiter('Sanjay')
        
        await waiter.assignShifts(['Monday', 'Tuesday', 'Friday', 'Wednesday'], 'Trinesh');
        await waiter.assignShifts(['Monday', 'Wednesday'], 'Mark');
        await waiter.assignShifts(['Monday', 'Wednesday'], 'Jerry');
        await waiter.assignShifts(['Sunday', 'Wednesday'], 'Sanjay');

        let displayShifts = await waiter.displayShifts();

         // Display Shifts for Tuesday: Color Yello < 3
         assert.deepEqual(await displayShifts[1].users, [ { waiter: 'Trinesh' }]);
         // Checks the color
         assert.deepEqual(await displayShifts[1].marked, 'smallerThanThree');
    })

    it('checks the color for Wednesday', async function() {
        let waiter = waiters(pool)

        await waiter.addWaiter('Trinesh');
        await waiter.addWaiter('Mark');
        await waiter.addWaiter('jerry');
        await waiter.addWaiter('Sanjay')
        
        await waiter.assignShifts(['Monday', 'Tuesday', 'Friday', 'Wednesday'], 'Trinesh');
        await waiter.assignShifts(['Monday', 'Wednesday'], 'Mark');
        await waiter.assignShifts(['Monday', 'Wednesday'], 'Jerry');
        await waiter.assignShifts(['Sunday', 'Wednesday'], 'Sanjay');

        let displayShifts = await waiter.displayShifts();

         //Display Shifts for Wednesday: Color Red > 3
         assert.deepEqual(await displayShifts[2].users, [ { waiter: 'Trinesh' },
         { waiter: 'Mark' },
         { waiter: 'Jerry' },
         { waiter: 'Sanjay' }]);

         // Checks the color
         assert.deepEqual(await displayShifts[2].marked, 'greaterThanThree');
    })

    it('checks the color for Thursday', async function() {
        let waiter = waiters(pool)

        await waiter.addWaiter('Trinesh');
        await waiter.addWaiter('Mark');
        await waiter.addWaiter('jerry');
        await waiter.addWaiter('Sanjay')
        
        await waiter.assignShifts(['Monday', 'Tuesday', 'Friday', 'Wednesday'], 'Trinesh');
        await waiter.assignShifts(['Monday', 'Wednesday'], 'Mark');
        await waiter.assignShifts(['Monday', 'Wednesday'], 'Jerry');
        await waiter.assignShifts(['Sunday', 'Wednesday'], 'Sanjay');

        let displayShifts = await waiter.displayShifts();

         // Display Shifts for Tuesday: Color Yello < 3
         assert.deepEqual(await displayShifts[3].users, []);
         // Checks the color
         assert.deepEqual(await displayShifts[3].marked, 'nothing');
    });

    it('checks the color for Friday', async function() {
        let waiter = waiters(pool)

        await waiter.addWaiter('Trinesh');
        await waiter.addWaiter('Mark');
        await waiter.addWaiter('jerry');
        await waiter.addWaiter('Sanjay')
        
        await waiter.assignShifts(['Monday', 'Tuesday', 'Friday', 'Wednesday'], 'Trinesh');
        await waiter.assignShifts(['Monday', 'Wednesday'], 'Mark');
        await waiter.assignShifts(['Monday', 'Wednesday'], 'Jerry');
        await waiter.assignShifts(['Sunday', 'Wednesday'], 'Sanjay');

        let displayShifts = await waiter.displayShifts();

         // Display Shifts for Friday: Color Yello < 3
         assert.deepEqual(await displayShifts[4].users, [{waiter: 'Trinesh'}]);
         // Checks the color
         assert.deepEqual(await displayShifts[4].marked, 'smallerThanThree');
    });

    it('checks the color for Saturday', async function() {
        let waiter = waiters(pool)

        await waiter.addWaiter('Trinesh');
        await waiter.addWaiter('Mark');
        await waiter.addWaiter('jerry');
        await waiter.addWaiter('Sanjay')
        
        await waiter.assignShifts(['Monday', 'Tuesday', 'Friday', 'Wednesday'], 'Trinesh');
        await waiter.assignShifts(['Monday', 'Wednesday'], 'Mark');
        await waiter.assignShifts(['Monday', 'Wednesday'], 'Jerry');
        await waiter.assignShifts(['Sunday', 'Wednesday'], 'Sanjay');

        let displayShifts = await waiter.displayShifts();

         // Display Shifts for Saturday: Color purple = 0
         assert.deepEqual(await displayShifts[5].users, []);
         // Checks the color
         assert.deepEqual(await displayShifts[5].marked, 'nothing');
    });

    it('checks the color for Sunday', async function() {
        let waiter = waiters(pool)

        await waiter.addWaiter('Trinesh');
        await waiter.addWaiter('Mark');
        await waiter.addWaiter('jerry');
        await waiter.addWaiter('Sanjay')
        
        await waiter.assignShifts(['Monday', 'Tuesday', 'Friday', 'Wednesday'], 'Trinesh');
        await waiter.assignShifts(['Monday', 'Wednesday'], 'Mark');
        await waiter.assignShifts(['Monday', 'Wednesday'], 'Jerry');
        await waiter.assignShifts(['Sunday', 'Wednesday'], 'Sanjay');

        let displayShifts = await waiter.displayShifts();

         // Display Shifts for Sunday: Color Yello < 3
         assert.deepEqual(await displayShifts[6].users, [{waiter: 'Sanjay'}]);
         // Checks the color
         assert.deepEqual(await displayShifts[6].marked, 'smallerThanThree');
    });
    after(function () {
        pool.end();
    })
});