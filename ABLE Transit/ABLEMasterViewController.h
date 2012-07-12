//
//  ABLEMasterViewController.h
//  ABLE Transit
//
//  Created by Naomi Harrington on 12-07-12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>

@class ABLEDetailViewController;

@interface ABLEMasterViewController : UITableViewController

@property (strong, nonatomic) ABLEDetailViewController *detailViewController;

@end
