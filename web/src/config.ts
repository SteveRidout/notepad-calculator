export const exampleNote = {
  title: "Welcome Note",
  body: `Notepad meet Calculator
-----------------------

 - mix text with sums
 - a sane way to do multi-step calculations
 - sign up for free to sync across devices


Examples
--------

Edit these, or delete them all and start from scratch...

# Example 1: Time

How many weeks in a month?
  52 / 12

How many weekdays in a month?
  * 5

# Example 2: Monitor specs (demonstrates variables)

Use variables to represent full HD resolution:
  horizontal = 1920
  vertical = 1080

Calculate total pixels:
  pixels = horizontal * vertical

Basic trigonometry to figure out the pixel density:
  inches = 23
  dpi = sqrt(horizontal^2 + vertical^2) / inches

# Example 3: Accounting (demonstrates lists)

This example demonstrates the use of lists, let's create a list of income sources:
  4000 # salary
  600 # investment income

You can refer to the previous list of consecutive numbers using a special variable called above:
  income = above
  sum(income)

Now let's create a list of expenses:
  1500 # rent
  350 # utility bills
  210 # council tax
  400 # groceries
  300 # meals out
  600 # travel and other spending

expenses = above
sum(expenses)
  
amountSaved = sum(income) - sum(expenses)
fractionSaved = amountSaved / sum(income)


Attributions
------------

Calculations performed by https://mathjs.org

Created by https://steveridout.com`
};

/** This needs to match $max-mobile-width in constants.scss */
export const maxMobileWidth = 600;
