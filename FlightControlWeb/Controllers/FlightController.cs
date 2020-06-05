using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FlightControlWeb.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace FlightControlWeb.Controllers

{
    /*
    
    [Route("api/[controller]")]
    [ApiController]
    public class FlightController : ControllerBase
    {

        private IMemoryCache memory = new FlightManager();
        // GET: api/Flight
        [HttpGet]
        public IEnumerable<Flight> GetAllProducts()
        {
            return memory.GetAllFlight();
        }

        // GET: api/Flight/5
        [HttpGet("{id}", Name = "Get")]
        public string Get(int id)
        {
            return "value";
        }

        // POST: api/Flight
        [HttpPost]
        public Flight AddProduct(Flight fk)
        {
            memory.AddFlight(fk);
            return fk;

        }

        // PUT: api/Flight/5
        [HttpPut("{id}")]
        public void Put(int id, [FromBody] string value)
        {
        }

        // DELETE: api/ApiWithActions/5
        [HttpDelete("{id}")]
        public void Delete(int id)
        {
        }
    }
    */
}
